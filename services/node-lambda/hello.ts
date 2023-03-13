import { APIGatewayProxyEvent } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const s3Client = new S3();

const handler = async (event: APIGatewayProxyEvent, context: any) => {
    const buckets = await s3Client.listBuckets().promise();
    if (isAuthorized(event)) {
        return {
            statusCode: 200,
            body: JSON.stringify('You are authorized'),
            // body: `Hello from TSLambda! Here are your buckets: ${JSON.stringify(buckets.Buckets)}`,
        }
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify('You are not authorized'),
        }
    }
}

const isAuthorized = (event: APIGatewayProxyEvent): boolean => {
    const groups = event.requestContext.authorizer?.claims['cognito:groups'];
    if (groups) {
        return (groups as string).includes('admins');
    } else {
        return false;
    }
}

export {
    handler
};