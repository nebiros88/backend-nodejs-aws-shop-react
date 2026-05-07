import {
  APIGatewayProxyResult,
  APIGatewayProxyEventV2,
  Context,
} from 'aws-lambda';

import { getProductById } from '../services';

export const getProductsById = async (
  event: APIGatewayProxyEventV2,
  __context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const product = await getProductById(event.pathParameters?.productId || '');

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

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
