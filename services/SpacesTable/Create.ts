import { v4 } from 'uuid';
 
import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME;
const dbClient = new DynamoDB.DocumentClient();

const handler = async (event:APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

    // const item = {
    //     spaceId: v4(),
    // }
    
    const item = typeof event.body === 'object' ? event.body : JSON.parse(event.body);
    item.spaceId = v4();

    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: `Created item with id: ${item.spaceId}`,
    }

    try{
        await dbClient.put({
            TableName: TABLE_NAME!,
            Item: item,
        }).promise();
        return result;
    } catch (error) {
        return {
            body: (error as Error).message,
            statusCode: 500,
        }
    }
}

export {handler};