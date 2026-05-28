#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { BackendNodejsAwsShopReactProductServiceStack } from '../lib/backend-nodejs-aws-shop-react-product-service-stack';
import { BackendNodejsAwsShopReactAuthorizationServiceStack } from '../lib/backend-nodejs-aws-shop-react-authorization-service-stack';

const app = new cdk.App();

const authorizationServiceStack =
  new BackendNodejsAwsShopReactAuthorizationServiceStack(
    app,
    'BackendNodejsAwsShopReactAuthorizationServiceStack',
    {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    },
  );

const productServiceStack = new BackendNodejsAwsShopReactProductServiceStack(
  app,
  'BackendNodejsAwsShopReactProductServiceStack',
  {
    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */
    /* Uncomment the next line to specialize this stack for the AWS Account
     * and Region that are implied by the current CLI configuration. */
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  },
);

productServiceStack.addDependency(authorizationServiceStack);
