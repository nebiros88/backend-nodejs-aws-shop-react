import { SQSEvent, SQSBatchItemFailure, SQSBatchResponse } from 'aws-lambda';
import { CreateProductDto } from '../models';
import { createNewProduct } from '../services';
import { validateCreateProductDto } from '../utils';

export const catalogBatchProcess = async (
  event: SQSEvent,
): Promise<SQSBatchResponse> => {
  const batchErrorFailedObjects: Array<SQSBatchItemFailure> = [];

  for (const record of event.Records) {
    try {
      const parsedDto: CreateProductDto = JSON.parse(record.body);
      const { isValid, errors } = validateCreateProductDto(parsedDto);

      if (!isValid) {
        throw new Error(JSON.stringify(errors));
      }

      await createNewProduct(parsedDto);

      console.log(`Successfully processed record: ${record.body}`);
    } catch (error) {
      console.log(
        `Failed to process message with messageId: ${record.messageId}, error message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      batchErrorFailedObjects.push({ itemIdentifier: record.messageId });
    }
  }

  const response: SQSBatchResponse = {
    batchItemFailures: batchErrorFailedObjects,
  };

  console.log(`Batch process response: ${JSON.stringify(response, null, 2)}`);

  return response;
};
