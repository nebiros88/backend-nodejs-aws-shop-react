import {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Context,
} from 'aws-lambda';

import { getProductById } from '../services';

export const getProductsById = async (
  event: APIGatewayProxyEvent,
  __context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const product = await getProductById(event.queryStringParameters?.id || '');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(product),
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
