import { Credentials } from 'aws-sdk/lib/credentials';
import { AuthService } from './AuthService';
import { config } from './config';

import * as AWS from 'aws-sdk';

AWS.config.region = config.REGION;

async function getBuckets () {
    try {
        return await new AWS.S3().listBuckets().promise();
    } catch (error) {
        return undefined;
    }
}

async function callStaff() {
    const authService = new AuthService();
    
    const user = await authService.login(config.TEST_USER_NAME, config.TEST_USER_PASSWORD);
    await authService.getAWSTemporaryCreds(user);

    const credentials = AWS.config.credentials;
    const buckets = await getBuckets();
    const a = 5;
}

callStaff();
