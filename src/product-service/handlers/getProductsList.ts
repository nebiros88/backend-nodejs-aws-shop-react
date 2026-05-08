import {
  APIGatewayProxyResult,
  APIGatewayProxyEventV2,
  Context,
} from 'aws-lambda';

import { getProducts } from '../services';

export const getProductsList = async (
  event: APIGatewayProxyEventV2,
  __context: Context,
): Promise<APIGatewayProxyResult> => {
  // Each console.log automatically goes to CloudWatch Logs
  console.log(`Incoming event: ${JSON.stringify(event)}`);

  try {
    const products = await getProducts();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(products),
    };
  } catch (error: unknown) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Failed to load products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
    };
  }
};
