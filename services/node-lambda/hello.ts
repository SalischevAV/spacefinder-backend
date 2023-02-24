import { v4 } from 'uuid';

import { S3 } from 'aws-sdk';


const s3Client = new S3();

const handler = async (event:any, context: any) => {
    const buckets = await s3Client.listBuckets().promise();
    console.log('Got an event:');
    console.log(event);
    return {
        statusCode: 200,
        body: `Hello from TSLambda! Here are your buckets: ${JSON.stringify(buckets.Buckets)}`,
    }
}

export {
    handler
};