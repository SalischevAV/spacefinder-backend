import { join } from 'path';

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { AuthorizationType, LambdaIntegration, MethodOptions, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

import { AuthorizerWrapper } from './auth/AuthorizerWrapper';
import { GenericTable } from './GenericTable';

export class SpaceStack extends Stack {

    //define API Gateway
    private api = new RestApi(this, 'SpaceAPI'); 

    private authorizer: AuthorizerWrapper;

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

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        this.authorizer = new AuthorizerWrapper(this, this.api);
        
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
    }
}