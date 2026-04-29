import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

import { ReusableHttpApiGatewayConstruct } from './reusable-http-api-gateway-construct';

const LAMBDA_HANDLERS_PATH = '../src/product-service/handlers';

export class BackendNodejsAwsShopReactProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reusable HTTP API Gateway
    const api = new ReusableHttpApiGatewayConstruct(this, 'SharedHttpApi', {
      apiName: 'shared-http-api',
    });

    const getProductsListLambda = new NodejsFunction(
      this,
      'getProductsListLambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'getProductsList',
        entry: path.join(
          __dirname,
          `${LAMBDA_HANDLERS_PATH}/getProductsList.ts`,
        ),
      },
    );

    const getProductsByIdLambda = new NodejsFunction(
      this,
      'getProductsByIdLambda',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'getProductsById',
        entry: path.join(
          __dirname,
          `${LAMBDA_HANDLERS_PATH}/getProductsById.ts`,
        ),
      },
    );

    api.addLambda('/products', apigwv2.HttpMethod.GET, getProductsListLambda);
    api.addLambda(
      '/products/{productId}',
      apigwv2.HttpMethod.GET,
      getProductsByIdLambda,
    );

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.httpApi.url!,
    });
  }
}
