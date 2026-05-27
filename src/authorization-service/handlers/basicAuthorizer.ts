import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  Context,
} from 'aws-lambda';
import { generatePolicy } from '../services';

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent,
  __context: Context,
): Promise<APIGatewayAuthorizerResult> => {
  const authHeader = event.authorizationToken;

  if (!authHeader) throw new Error('Unauthorized'); // 401 API Gateway returns

  const [scheme, encodedCredentials] = authHeader.split(' ');

  if (scheme !== 'Basic' || !encodedCredentials) {
    return generatePolicy('user', 'Deny', event.methodArn); // 403 API Gateway returns
  }

  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString(
    'utf-8',
  );
  const [userName, userPassword] = decodedCredentials.split(':');

  if (!userName || !userPassword) {
    return generatePolicy('user', 'Deny', event.methodArn); // 403 will be returned bu APIGateway
  }

  const expectedUserPassword = process.env[userName];

  if (expectedUserPassword && expectedUserPassword === userPassword) {
    return generatePolicy(userName, 'Allow', event.methodArn);
  }

  return generatePolicy(userName, 'Deny', event.methodArn); // 403 will be returned bu APIGateway
};
