import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import { getProductsById } from './getProductsById';
import { getProductById } from '../services';

jest.mock('../services', () => ({
  getProductById: jest.fn(),
}));

const mockedGetProductById = getProductById as jest.Mock;

describe('getProductsById handler', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return 200 and product when found', async () => {
    const mockedProduct = {
      id: '123',
      title: 'Test Product 1',
      description: 'Test product 1 description',
      price: 9,
      count: 5,
    };

    mockedGetProductById.mockResolvedValue(mockedProduct);

    const event: unknown = { pathParameters: { productId: '123' } };

    const result = await getProductsById(
      event as APIGatewayProxyEventV2,
      {} as Context,
    );
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockedProduct);
    expect(mockedGetProductById).toHaveBeenCalledWith('123');
  });

  it('should return 500 when service throws error', async () => {
    const TEST_ERROR_MESSAGE = 'Error test message';

    mockedGetProductById.mockRejectedValue(new Error(TEST_ERROR_MESSAGE));

    const event: unknown = { pathParameters: { productId: '123' } };

    const result = await getProductsById(
      event as APIGatewayProxyEventV2,
      {} as Context,
    );
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toContain(TEST_ERROR_MESSAGE);
  });

  it('should handle missing productId properly', async () => {
    mockedGetProductById.mockResolvedValue(null);

    const event: unknown = { pathParameters: {} };

    const result = await getProductsById(
      event as APIGatewayProxyEventV2,
      {} as Context,
    );
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toContain('Product not found');
    expect(mockedGetProductById).toHaveBeenCalledWith('');
  });
});
