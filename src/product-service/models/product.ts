export type TableProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
};

export type Product = TableProduct & {
  count: number;
};

export type CreateProductDto = Omit<Product, 'id'>;
