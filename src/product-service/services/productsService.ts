import {
  ScanCommand,
  GetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../constants';
import { dynamoDbClient } from '../libs';
import { CreateProductDto, Product, TableProduct, TableStock } from '../models';
import { v4 as uuid } from 'uuid';

export const getProducts = async (): Promise<Array<Product>> => {
  const [productsResponse, stocksResponse] = await Promise.all([
    dynamoDbClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE_NAME,
      }),
    ),
    dynamoDbClient.send(
      new ScanCommand({
        TableName: STOCKS_TABLE_NAME,
      }),
    ),
  ]);

  const products: Array<TableProduct> =
    (productsResponse.Items as Array<TableProduct>) || [];
  const stocks: Array<TableStock> =
    (stocksResponse.Items as Array<TableStock>) || [];

  return products.map((p) => {
    const stock = stocks.find((s) => s.product_id === p.id);

    return {
      ...p,
      count: stock?.count || 0,
    } as Product;
  });
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const [productResponse, stockResponse] = await Promise.all([
    dynamoDbClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE_NAME,
        Key: {
          id,
        },
      }),
    ),
    dynamoDbClient.send(
      new GetCommand({
        TableName: STOCKS_TABLE_NAME,
        Key: {
          product_id: id,
        },
      }),
    ),
  ]);

  if (!productResponse.Item) return null;

  return {
    ...productResponse.Item,
    count: stockResponse?.Item?.count || 0,
  } as Product;
};

export const createNewProduct = async ({
  count,
  ...restDto
}: CreateProductDto): Promise<Product> => {
  const id = uuid();
  const product = {
    id,
    ...restDto,
  };

  const stock = {
    product_id: id,
    count,
  };

  await dynamoDbClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: PRODUCTS_TABLE_NAME,
            Item: product,
          },
        },
        {
          Put: {
            TableName: STOCKS_TABLE_NAME,
            Item: stock,
          },
        },
      ],
    }),
  );

  return {
    ...product,
    count: stock.count,
  };
};
