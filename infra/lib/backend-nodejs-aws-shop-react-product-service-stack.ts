import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as path from 'path';

import { ReusableHttpApiGatewayConstruct } from './reusable-http-api-gateway-construct';

const PRODUCT_SERVICE_LAMBDA_HANDLERS_PATH =
  '../../src/product-service/handlers';
const IMPORT_SERVICE_LAMBDA_HANDLERS_PATH = '../../src/import-service/handlers';

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

    // import already created S3Bucket
    const importBucket = s3.Bucket.fromBucketName(
      this,
      'ImportBucket',
      'import-bucket-144554328995-eu-central-1-an',
    );

    const dynamoDbTableEnvironmentVariables = {
      PRODUCTS_TABLE_NAME: productsTable.tableName,
      STOCKS_TABLE_NAME: stocksTable.tableName,
    };

    const commonLambdaProps: cdk.aws_lambda_nodejs.NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    };

    const getProductsListLambda = new NodejsFunction(
      this,
      'getProductsListLambda',
      {
        handler: 'getProductsList',
        entry: path.join(
          __dirname,
          `${PRODUCT_SERVICE_LAMBDA_HANDLERS_PATH}/getProductsList.ts`,
        ),
        environment: {
          ...dynamoDbTableEnvironmentVariables,
        },
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
          `${PRODUCT_SERVICE_LAMBDA_HANDLERS_PATH}/getProductsById.ts`,
        ),
        environment: {
          ...dynamoDbTableEnvironmentVariables,
        },
        ...commonLambdaProps,
      },
    );

    const createProductLambda = new NodejsFunction(
      this,
      'createProductLambda',
      {
        handler: 'createProduct',
        entry: path.join(
          __dirname,
          `${PRODUCT_SERVICE_LAMBDA_HANDLERS_PATH}/createProduct.ts`,
        ),
        environment: {
          ...dynamoDbTableEnvironmentVariables,
        },
        ...commonLambdaProps,
      },
    );

    const importProductsFileLambda = new NodejsFunction(
      this,
      'importProductsFileLambda',
      {
        handler: 'importProductsFile',
        entry: path.join(
          __dirname,
          `${IMPORT_SERVICE_LAMBDA_HANDLERS_PATH}/importProductsFile.ts`,
        ),
        environment: {
          AWS_S3_IMPORT_BUCKET_NAME: importBucket.bucketName,
          AWS_S3_IMPORT_BUCKET_REGION: this.region,
        },
        ...commonLambdaProps,
      },
    );

    const importFileParserLambda = new NodejsFunction(
      this,
      'importFileParserLambda',
      {
        handler: 'importFileParser',
        entry: path.join(
          __dirname,
          `${IMPORT_SERVICE_LAMBDA_HANDLERS_PATH}/importFileParser.ts`,
        ),
        environment: {
          AWS_S3_IMPORT_BUCKET_REGION: this.region,
        },
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

    api.addLambda('/import', apigwv2.HttpMethod.GET, importProductsFileLambda, {
      queryParams: ['name'],
    });

    // grant IAM permissions to lambdas to access DynamoDB
    productsTable.grantReadWriteData(getProductsListLambda);
    productsTable.grantReadWriteData(getProductsByIdLambda);
    productsTable.grantWriteData(createProductLambda);

    stocksTable.grantReadWriteData(getProductsListLambda);
    stocksTable.grantReadWriteData(getProductsByIdLambda);
    stocksTable.grantWriteData(createProductLambda);

    // grant IAM permissions to access S3Bucket
    importBucket.grantPut(importProductsFileLambda);
    importBucket.grantPut(importFileParserLambda);

    // S3Bucket event configuration
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      {
        prefix: 'uploaded/',
      },
    );

    // output
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.httpApi.url!,
    });
  }
}
