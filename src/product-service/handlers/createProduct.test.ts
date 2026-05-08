import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createNewProduct } from '../services';
import { createProduct } from './createProduct';

jest.mock('../services', () => ({
  createNewProduct: jest.fn(),
}));

const mockedCreateProduct = createNewProduct as jest.Mock;

describe('createProduct handler', () => {
  afterEach(() => jest.clearAllMocks());
  it('should return 201 and create new product', async () => {
    const mockedNewProduct = {
      id: 'test-uuid-123',
      title: 'Test Product 1',
      description: 'Test product 1 description',
      price: 9,
      count: 5,
    };

    mockedCreateProduct.mockResolvedValue(mockedNewProduct);

    const result = await createProduct(
      {
        body: JSON.stringify({
          title: 'Test Product 1',
          description: 'Test product 1 description',
          price: 9,
          count: 5,
        }),
      } as APIGatewayProxyEventV2,
      {} as Context,
    );

    expect(mockedCreateProduct).toHaveBeenCalled();
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual(mockedNewProduct);
  });

  it('should return 400 for invalid new product data', async () => {
    const result = await createProduct(
      {
        body: JSON.stringify({
          title: 'Test Product 1',
          description: 'Test product 1 description',
          price: -5,
          count: 5,
        }),
      } as APIGatewayProxyEventV2,
      {} as Context,
    );

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('Invalid product data!');
  });
});
