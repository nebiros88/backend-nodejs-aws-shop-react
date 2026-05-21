import { S3Event } from 'aws-lambda';
import { parseImportedFile } from '../services';

export const importFileParser = async (event: S3Event): Promise<void> => {
  // Each console.log automatically goes to CloudWatch Logs
  console.log(`Incoming S3 event: ${JSON.stringify(event)}`);

  try {
    await parseImportedFile(event);
    console.log('CSV file has been successfully parsed!');
  } catch (error: unknown) {
    console.log(
      `importFileParser execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};
