import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { CreateProductDto } from '../models';
import { createNewProduct } from '../services';

export const createProduct = async (
  event: APIGatewayProxyEventV2,
  __context: Context,
): Promise<APIGatewayProxyResult> => {
  // Each console.log automatically goes to CloudWatch Logs
  console.log(`Incoming event: ${JSON.stringify(event)}`);
  console.log(`Create product body: ${JSON.stringify(event.body)}`);

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missed request body' }),
      };
    }

    const body = JSON.parse(event.body) as CreateProductDto;

    if (
      !body.title ||
      !body.description ||
      typeof body.price !== 'number' ||
      typeof body.count !== 'number' ||
      body.price < 0 ||
      body.count < 0
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid product data!' }),
      };
    }

    const createProductResult = await createNewProduct(JSON.parse(event.body));

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(createProductResult),
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
