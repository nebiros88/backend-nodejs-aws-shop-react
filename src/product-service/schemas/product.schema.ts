import * as z from 'zod';

export const ProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(2),
  price: z.number().positive(),
  count: z.number().int().nonnegative(),
});
