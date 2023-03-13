import { Amplify, Auth } from 'aws-amplify';
import { CognitoUser } from '@aws-amplify/auth';

import { config } from './config';

Amplify.configure({
    Auth: {
        mandatorySignIn: false,
        region: config.REGION,
        userPoolId: config.USER_POOL_ID,
        userPoolWebClientId: config.APP_CLIENT_ID,
        authenticationFlowType: 'USER_PASSWORD_AUTH',
    }
})

export class AuthService {
    public async login(userName:string, password: string): Promise<CognitoUser>{
            const user = await Auth.signIn(userName, password) as CognitoUser;
            return user;
    }
}