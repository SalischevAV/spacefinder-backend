import { v4 } from 'uuid';
 
import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';


const dbClient = new DynamoDB.DocumentClient();

const handler =async (event:APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {

    const item = {
        spaceId: v4()
    }
    
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hello from DynamoDB',
    }

    try{
        await dbClient.put({
            TableName: 'SpacesTable',
            Item: item,
        }).promise();
    } catch (error) {
        result.body = (error as Error).message;
        result.statusCode = 500;
    }

    return result;
}

export {handler};