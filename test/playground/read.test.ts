import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../services/SpacesTable/Read';

const event: APIGatewayProxyEvent = {
    queryStringParameters: {
        spaceId: 'qwe'
    }
} as any;

const eventSecondary: APIGatewayProxyEvent = {
    queryStringParameters: {
        location: 'London'
    }
} as any;

const result = handler({} as any, {} as any).then(data => {
    const items = JSON.parse(data.body);
    console.log(items);
});

const singleResultWithPrimaryKey = handler(event, {} as any).then(data => {
    const items = JSON.parse(data.body);
    console.log(items);
});

const singleResultWithSecondaryKey = handler(eventSecondary, {} as any).then(data => {
    const items = JSON.parse(data.body);
    console.log(items);
});