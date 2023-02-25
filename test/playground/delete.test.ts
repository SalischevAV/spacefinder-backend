import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../services/SpacesTable/Delete';

const event: APIGatewayProxyEvent = {
    queryStringParameters: {
        spaceId: 'a3c986d7-1615-4599-a3e4-58324b8130a9'
    }
} as any;

const result =  handler(event, {} as any).then( data => {
    const result = JSON.parse(data.body);
    console.log(result); 
});