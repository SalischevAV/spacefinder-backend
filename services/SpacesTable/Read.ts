import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult, Context } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const dbClient = new DynamoDB.DocumentClient();

const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

    try {
        if (event.queryStringParameters) {
            if (PRIMARY_KEY in event.queryStringParameters) {
                return {
                    statusCode: 200,
                    body: await queryWithPrimaryPartition(event.queryStringParameters)
                }
            } else {
                return {
                    statusCode: 200,
                    body: await queryWithSecondaryPartition(event.queryStringParameters)
                }
            }

        } else {
            return {
                statusCode: 200,
                body: await scanTable()
            };
        }
    } catch (error) {
        return {
            body: (error as Error).message,
            statusCode: 500,
        }
    }
}

const scanTable = async () => {
    const queryResponse = await dbClient.scan({
        TableName: TABLE_NAME!,
    }).promise();
    return JSON.stringify(queryResponse.Items)
}

const queryWithPrimaryPartition = async (queryParams: APIGatewayProxyEventQueryStringParameters) => {
    const keyValue = queryParams[PRIMARY_KEY];
    const queryResponse = await dbClient.query({
        TableName: TABLE_NAME!,
        KeyConditionExpression: '#zz = :zzzz',
        ExpressionAttributeNames: {
            '#zz': PRIMARY_KEY!,
        },
        ExpressionAttributeValues: {
            ':zzzz': keyValue,
        }
    }).promise();
    return JSON.stringify(queryResponse.Items)
}

const queryWithSecondaryPartition = async (queryParams: APIGatewayProxyEventQueryStringParameters) => {
    const queryKey = Object.keys(queryParams)[0];
    const queryValue = queryParams[queryKey];
    const queryResponse = await dbClient.query({
        TableName: TABLE_NAME!,
        IndexName: queryKey,
        KeyConditionExpression: '#zz = :zzzz',
        ExpressionAttributeNames: {
            '#zz': queryKey,
        },
        ExpressionAttributeValues: {
            ':zzzz': queryValue,
        }
    }).promise();
    return JSON.stringify(queryResponse.Items);
}

export { handler };