import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME as string;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;
const dbClient = new DynamoDB.DocumentClient();

const handler = async (event:APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: `Hello from delete Lambda`,
    }

    const spaceId = event.queryStringParameters?.[PRIMARY_KEY]

    if(spaceId){
        try{
            const deleteResult = await dbClient.delete({
                TableName: TABLE_NAME,
                Key: {
                    [PRIMARY_KEY]: spaceId,
                }
            }).promise();
            return {
                statusCode: 204,
                body: JSON.stringify(deleteResult),
            }

        } catch(error){
            const deleteError = (error as Error);
            return {
                statusCode: 500,
                body: deleteError.message,
            }
        }
    }

    return result;
}

export {handler};