import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import {MissingFieldError, validateAsSpaceEntry} from '../Shared/InputValidator';
import { addCorsHeader, generateRandomId, getEventBody } from '../Shared/Utils';

const TABLE_NAME = process.env.TABLE_NAME;
const dbClient = new DynamoDB.DocumentClient();

const handler = async (event:APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => { 
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: ''
    }
    addCorsHeader(result);
    try{
        const item = getEventBody(event);
        item.spaceId = generateRandomId();

        validateAsSpaceEntry(item);

        await dbClient.put({
            TableName: TABLE_NAME!,
            Item: item,
        }).promise();
        return {
            ...result,
            statusCode: 200,
            body: `Created item with id: ${item.spaceId}`,
        };
    } catch (error) {
        if( error instanceof MissingFieldError){
            return {
                ...result,
                body: error.message,
                statusCode: 404,
            }
        }
        return {
            ...result,
            body: (error as Error).message,
            statusCode: 500,
        }
    }
}

export { handler };