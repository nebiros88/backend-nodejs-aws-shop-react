import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import { getProductsList } from './getProductsList';
import { getProducts } from '../services';

jest.mock('../services', () => ({
  getProducts: jest.fn(),
}));

const mockedGetProducts = getProducts as jest.Mock;

describe('getProductsList handler', () => {
  afterEach(() => jest.clearAllMocks());

  it('should return 200 and products list', async () => {
    const mockedProducts = [
      {
        id: '123',
        title: 'Test Product 1',
        description: 'Test product 1 description',
        price: 9,
        count: 5,
      },
      {
        id: '1234',
        title: 'Test Product 2',
        description: 'Test product 2 description',
        price: 99,
        count: 5,
      },
    ];

    mockedGetProducts.mockResolvedValue(mockedProducts);

    const result = await getProductsList(
      {} as APIGatewayProxyEventV2,
      {} as Context,
    );

    expect(mockedGetProducts).toHaveBeenCalled();
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockedProducts);
  });

  it('should return 500 when service throws error', async () => {
    const ERROR_MESSAGE = 'Server error';

    mockedGetProducts.mockRejectedValue(new Error(ERROR_MESSAGE));

    const result = await getProductsList(
      {} as APIGatewayProxyEventV2,
      {} as Context,
    );

    expect(mockedGetProducts).toHaveBeenCalled();
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toContain(ERROR_MESSAGE);
  });
});
