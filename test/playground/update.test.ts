import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../services/SpacesTable/Update';

const event: APIGatewayProxyEvent = {
    body: {
        location: 'Adis-Abebba',
    },
    queryStringParameters: {
        spaceId: 'ae2eb0ea-e9a8-4fbc-8c73-8d9616bae186'
    }
} as any;

const result =  handler(event, {} as any).then( data => {
    const result = JSON.parse(data.body);
    console.log(result); 
});