import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { importProducts } from '../services';

export const importProductsFile = async (
  event: APIGatewayProxyEventV2,
  __context: Context,
): Promise<APIGatewayProxyResult> => {
  // Each console.log automatically goes to CloudWatch Logs
  console.log(`Incoming event: ${JSON.stringify(event)}`);
  console.log(
    `Import products file name: ${JSON.stringify(event.queryStringParameters?.name || 'file name not provided!')}`,
  );

  try {
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'File name is required!' }),
      };
    }

    const signedUrl: string = await importProducts(fileName);

    return {
      statusCode: 200,
      body: signedUrl,
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
