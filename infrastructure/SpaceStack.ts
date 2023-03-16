import { join } from 'path';

import { Fn, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { AuthorizationType, LambdaIntegration, MethodOptions, ResourceOptions, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

import { AuthorizerWrapper } from './auth/AuthorizerWrapper';
import { GenericTable } from './GenericTable';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';

export class SpaceStack extends Stack {

    //define API Gateway
    private api = new RestApi(this, 'SpaceAPI'); 

    //define authorizer
    private authorizer: AuthorizerWrapper;
    
    private suffix: string;
    private spacePhotosBucket: Bucket;

    //create DynamoDB table
    // private spacesTable = new GenericTable(
    //     'SpacesTable', //Table name
    //     'spaceId', //primary key -> partition key
    //     this,
    // );
    private spacesTable = new GenericTable(this, {
        tableName: 'SpacesTable',
        primaryKey: 'spaceId',
        createLambdaPath: 'Create',
        readLambdaPath: 'Read',
        updateLambdaPath: 'Update',
        deleteLambdaPath: 'Delete',
        secondaryIndexes: ['location'],
    });

    private reservationsTable = new GenericTable(this, {
        tableName: 'ReservationsTable',
        primaryKey: 'reservationId',
        createLambdaPath: 'Create',
        readLambdaPath: 'Read',
        updateLambdaPath: 'Update',
        deleteLambdaPath: 'Delete',
        secondaryIndexes: ['user']
    })

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.initializeSuffix();
        this.initializeSpacePhotosBucket();
        this.authorizer = new AuthorizerWrapper(this, this.api, `${this.spacePhotosBucket.bucketArn}/*`);
        
        //define lambda by aws-cdk-lib/aws-lambda
        const helloLambda = new LambdaFunction(this, 'helloLambda', {
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset(join(__dirname, '..', 'services', 'hello')),
            handler: 'hello.main',
        });

        //define lambda by aws-cdk-lib/aws-lambda-nodejs
        const helloNodeJsLambda = new NodejsFunction(
            this,
            'helloNodeJsLambda',
            {
                entry: (join(__dirname, '..', 'services', 'node-lambda', 'hello.ts')),
                handler: 'handler',
            }
        );

        //attach policy to lambda
        const s3ListPolicy = new PolicyStatement();
        s3ListPolicy.addActions('s3:ListAllMyBuckets');
        s3ListPolicy.addResources('*');
        helloNodeJsLambda.addToRolePolicy(s3ListPolicy);

        //add authorizer to API
        const optionsWithAuthorizer: MethodOptions = {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: {
                authorizerId: this.authorizer.authorizer.authorizerId,
            }
        };

        const optionsWithCors:ResourceOptions = {
            defaultCorsPreflightOptions : {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS
            }
        }

        //Api and Lambda integration
        const helloLambdaIntegration = new LambdaIntegration(helloNodeJsLambda); //add our lambda to API
        const helloLambdaResource = this.api.root.addResource('hello'); //path
        helloLambdaResource.addMethod('GET', helloLambdaIntegration, optionsWithAuthorizer);

        //Spaces API integration
        const spaceResource = this.api.root.addResource('spaces');
        spaceResource.addMethod('POST', this.spacesTable.createLambdaIntegration);
        spaceResource.addMethod('GET', this.spacesTable.readLambdaIntegration);
        spaceResource.addMethod('PUT', this.spacesTable.updateLambdaIntegration);
        spaceResource.addMethod('DELETE', this.spacesTable.deleteLambdaIntegration);

          //Reservations API integrations:
          const reservationResource = this.api.root.addResource('reservations', optionsWithCors);
          reservationResource.addMethod('POST', this.reservationsTable.createLambdaIntegration, optionsWithAuthorizer);
          reservationResource.addMethod('GET', this.reservationsTable.readLambdaIntegration, optionsWithAuthorizer);
          reservationResource.addMethod('PUT', this.reservationsTable.updateLambdaIntegration, optionsWithAuthorizer);
          reservationResource.addMethod('DELETE', this.reservationsTable.deleteLambdaIntegration, optionsWithAuthorizer);
    }

    private initializeSuffix(){
        const shortStackId = Fn.select(2, Fn.split('/', this.stackId));
        const Suffix = Fn.select(4, Fn.split('-', shortStackId));
        this.suffix = Suffix;
    }

    private initializeSpacePhotosBucket(){
        this.spacePhotosBucket = new Bucket(this, 'spaces-photos', {
            bucketName: `spaces-photos-${this.suffix}`,
            cors: [{
                allowedMethods: [
                    HttpMethods.GET,
                    HttpMethods.PUT,
                    HttpMethods.HEAD,
                ],
                allowedOrigins: ['*'],
                allowedHeaders: ['*'],
            }]
        })

        new CfnOutput(this, 'space-photos-bucket-name', {
            value: this.spacePhotosBucket.bucketName,
        })
    }
}