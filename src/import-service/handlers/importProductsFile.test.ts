import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { importProducts } from '../services';
import { importProductsFile } from './importProductsFile';

jest.mock('../services', () => ({
  importProducts: jest.fn(),
}));

const mockedImportProducts = importProducts as jest.Mock;

describe('importProductsFile handler', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 200 and signedUrl', async () => {
    const mockedSignedURL = 'test-signed-url';
    const mockedFileName = 'test-file.csv';

    mockedImportProducts.mockResolvedValue(mockedSignedURL);

    const event: unknown = { queryStringParameters: { name: mockedFileName } };

    const result = await importProductsFile(
      event as APIGatewayProxyEventV2,
      {} as Context,
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain(mockedSignedURL);
    expect(mockedImportProducts).toHaveBeenCalledWith(mockedFileName);
  });

  it('should return 400 and error message', async () => {
    const event: unknown = { queryStringParameters: { name: undefined } };

    const result = await importProductsFile(
      event as APIGatewayProxyEventV2,
      {} as Context,
    );

    expect(mockedImportProducts).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('File name is required!');
  });

  it('should return 500 when service throws error', async () => {
    const mockedFileName = 'test-file.csv';
    const errorMessage = 'test-error-message';
    const event: unknown = { queryStringParameters: { name: mockedFileName } };

    mockedImportProducts.mockRejectedValue(new Error(errorMessage));

    const result = await importProductsFile(
      event as APIGatewayProxyEventV2,
      {} as Context,
    );

    expect(mockedImportProducts).toHaveBeenCalledWith(mockedFileName);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toContain(errorMessage);
  });
});
