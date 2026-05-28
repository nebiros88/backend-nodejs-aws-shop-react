import { SQSEvent, SQSBatchItemFailure, SQSBatchResponse } from 'aws-lambda';
import { CreateProductDto, Product } from '../models';
import {
  createNewProduct,
  publishBatchProductsCreationNotification,
} from '../services';
import { validateCreateProductDto } from '../utils';

export const catalogBatchProcess = async (
  event: SQSEvent,
): Promise<SQSBatchResponse> => {
  const batchErrorFailedObjects: Array<SQSBatchItemFailure> = [];
  const createdProducts: Array<Product> = [];

  for (const record of event.Records) {
    try {
      const parsedDto: CreateProductDto = JSON.parse(record.body);
      const { isValid, errors } = validateCreateProductDto(parsedDto);

      if (!isValid) {
        throw new Error(JSON.stringify(errors));
      }

      const createdProduct = await createNewProduct(parsedDto);
      createdProducts.push(createdProduct);

      console.log(`Successfully processed record: ${record.body}`);
    } catch (error) {
      console.log(
        `Failed to process message with messageId: ${record.messageId}, error message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      batchErrorFailedObjects.push({ itemIdentifier: record.messageId });
    }
  }

  if (createdProducts.length > 0) {
    for (const product of createdProducts) {
      await publishBatchProductsCreationNotification(product);
    }
  }

  const response: SQSBatchResponse = {
    batchItemFailures: batchErrorFailedObjects,
  };

  console.log(`Batch process response: ${JSON.stringify(response, null, 2)}`);

  return response;
};
