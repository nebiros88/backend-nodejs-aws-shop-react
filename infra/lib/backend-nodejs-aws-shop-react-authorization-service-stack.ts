import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { Construct } from 'constructs';
import * as path from 'path';

const AUTHORIZATION_SERVICE_LAMBDA_HANDLERS_PATH =
  '../../src/authorization-service/handlers';

export class BackendNodejsAwsShopReactAuthorizationServiceStack
  extends cdk.Stack
{
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authLogin = process.env.AUTH_LOGIN || '';
    const authPassword = process.env.AUTH_PASSWORD || '';

    const basicAuthorizerLambda = new NodejsFunction(
      this,
      'basicAuthorizerLambda',
      {
        handler: 'basicAuthorizer',
        entry: path.join(
          __dirname,
          `${AUTHORIZATION_SERVICE_LAMBDA_HANDLERS_PATH}/basicAuthorizer.ts`,
        ),
        runtime: lambda.Runtime.NODEJS_20_X,
        bundling: {
          minify: true,
          sourceMap: true,
        },
        environment: {
          [authLogin]: authPassword,
        },
      },
    );

    // export lambda to be imported in another stack
    new cdk.CfnOutput(this, 'BasicAuthorizerLambda', {
      value: basicAuthorizerLambda.functionArn,
      exportName: 'BasicAuthorizerLambdaArn',
    });
  }
}
