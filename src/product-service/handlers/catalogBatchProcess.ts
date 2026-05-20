import { SQSEvent, SQSBatchItemFailure, SQSBatchResponse } from 'aws-lambda';

export const catalogBatchProcess = async (
  event: SQSEvent,
): Promise<SQSBatchResponse> => {
  const batchErrorFailedObjects: Array<SQSBatchItemFailure> = [];

  for (const record of event.Records) {
    try {
      ////
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
