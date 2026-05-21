import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

interface ReusableHttpApiProps {
  apiName: string;
}

interface LambdaRouteOptions {
  queryParams?: string[];
}

export class ReusableHttpApiGatewayConstruct extends Construct {
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: ReusableHttpApiProps) {
    super(scope, id);

    this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: props.apiName,
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'],
      },
    });
  }

  public addLambda(
    path: string,
    method: apigwv2.HttpMethod,
    lambda: IFunction,
    options?: LambdaRouteOptions,
  ) {
    this.httpApi.addRoutes({
      path,
      methods: [method],
      integration: new integrations.HttpLambdaIntegration(
        `${path}-${method}-integration`,
        lambda,
      ),
    });

    if (options?.queryParams) {
      console.log(
        `Route ${path} expects query params: ${options.queryParams.join(', ')}`,
      );
    }
  }
}
