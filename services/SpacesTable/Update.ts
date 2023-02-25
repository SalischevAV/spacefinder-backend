import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME as string;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;
const dbClient = new DynamoDB.DocumentClient();

const handler = async (event:APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: `Hello from update Lambda`,
    }

    const requestBody = typeof event.body === 'object' ? event.body : JSON.parse(event.body);
    const spaceId = event.queryStringParameters?.[PRIMARY_KEY]

    if(requestBody && spaceId){
        try{

            const requestBodyKey = Object.keys(requestBody)[0];
            const requestBodyValue = requestBody[requestBodyKey];
            const updateResult = await dbClient.update({
                TableName: TABLE_NAME,
                Key: {
                    [PRIMARY_KEY]: spaceId
                },
                UpdateExpression: 'set #zzzNew = :new',
                ExpressionAttributeValues:{
                    ':new': requestBodyValue
                },
                ExpressionAttributeNames:{
                    '#zzzNew': requestBodyKey
                },
                ReturnValues: 'UPDATED_NEW'
            }).promise();
            return {
                statusCode: 201,
                body: JSON.stringify(updateResult),
            }
        } catch(error){
            console.log((error as Error).message);
        }
    }

    return result;
}

export {handler};