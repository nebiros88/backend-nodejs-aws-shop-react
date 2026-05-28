import z from 'zod';
import { CreateProductDto } from '../models';
import { ProductSchema } from '../schemas';

interface CreateProductDtoValidationResult {
  isValid: boolean;
  errors: z.core.$ZodIssue[] | null;
}

export const validateCreateProductDto = (
  dto: CreateProductDto,
): CreateProductDtoValidationResult => {
  const result = ProductSchema.safeParse(dto);

  if (result.success) {
    return {
      isValid: true,
      errors: null,
    };
  }

  return {
    isValid: false,
    errors: result.error.issues,
  };
};
