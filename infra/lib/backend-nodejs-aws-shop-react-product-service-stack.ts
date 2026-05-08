import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

import { ReusableHttpApiGatewayConstruct } from './reusable-http-api-gateway-construct';

const LAMBDA_HANDLERS_PATH = '../../src/product-service/handlers';

export class BackendNodejsAwsShopReactProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reusable HTTP API Gateway
    const api = new ReusableHttpApiGatewayConstruct(this, 'SharedHttpApi', {
      apiName: 'shared-http-api',
    });

    // import already created dynamoDb tables (products and stocks)
    const productsTable = dynamoDb.Table.fromTableName(
      this,
      'ProductsTable',
      'products',
    );

    const stocksTable = dynamoDb.Table.fromTableName(
      this,
      'StocksTable',
      'stocks',
    );

    const commonLambdaProps: cdk.aws_lambda_nodejs.NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    };

    const getProductsListLambda = new NodejsFunction(
      this,
      'getProductsListLambda',
      {
        handler: 'getProductsList',
        entry: path.join(
          __dirname,
          `${LAMBDA_HANDLERS_PATH}/getProductsList.ts`,
        ),
        ...commonLambdaProps,
      },
    );

    const getProductsByIdLambda = new NodejsFunction(
      this,
      'getProductsByIdLambda',
      {
        handler: 'getProductsById',
        entry: path.join(
          __dirname,
          `${LAMBDA_HANDLERS_PATH}/getProductsById.ts`,
        ),
        ...commonLambdaProps,
      },
    );

    const createProductLambda = new NodejsFunction(
      this,
      'createProductLambda',
      {
        handler: 'createProduct',
        entry: path.join(__dirname, `${LAMBDA_HANDLERS_PATH}/createProduct.ts`),
        ...commonLambdaProps,
      },
    );

    api.addLambda('/products', apigwv2.HttpMethod.GET, getProductsListLambda);
    api.addLambda(
      '/products/{productId}',
      apigwv2.HttpMethod.GET,
      getProductsByIdLambda,
    );
    api.addLambda('/products', apigwv2.HttpMethod.POST, createProductLambda);

    // grant IAM permissions to lambdas to access DynamoDB
    productsTable.grantReadWriteData(getProductsListLambda);
    productsTable.grantReadWriteData(getProductsByIdLambda);
    productsTable.grantWriteData(createProductLambda);

    stocksTable.grantReadWriteData(getProductsListLambda);
    stocksTable.grantReadWriteData(getProductsByIdLambda);
    stocksTable.grantWriteData(createProductLambda);

    // output
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.httpApi.url!,
    });
  }
}
