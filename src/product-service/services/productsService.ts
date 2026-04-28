import { Product } from '../models';
import { PRODUCTS } from '../mocks';

export const getProducts = async (): Promise<Array<Product>> => {
  return Promise.resolve(PRODUCTS);
};

export const getProductById = async (
  id: string,
): Promise<Product | undefined> => {
  const product = PRODUCTS.find((p) => p.id === id);
  return Promise.resolve(product);
};
