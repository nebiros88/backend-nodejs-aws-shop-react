import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { S3Event } from 'aws-lambda';
import csv from 'csv-parser';
import {
  AWS_S3_IMPORT_BUCKET_REGION,
  AWS_S3_IMPORT_BUCKET_NAME,
  AWS_SQS_CATALOG_ITEMS_QUEUE_URL,
} from '../constants';

const PRESIGNED_URL_EXPIRATION_LIMIT_IN_SECONDS = 180;

export const importProducts = async (fileName: string) => {
  const key = `uploaded/${fileName}`;

  const client = new S3Client({ region: AWS_S3_IMPORT_BUCKET_REGION });
  const command = new PutObjectCommand({
    Bucket: AWS_S3_IMPORT_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION_LIMIT_IN_SECONDS,
  });
};

export const parseImportedFile = async (s3Event: S3Event): Promise<void> => {
  const client = new S3Client({ region: AWS_S3_IMPORT_BUCKET_REGION });
  const sqsClient = new SQSClient({ region: AWS_S3_IMPORT_BUCKET_REGION });

  for (const record of s3Event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(command);
    const stream = response.Body as NodeJS.ReadableStream;

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', async (data) => {
          // console.log(`CSV record: ${JSON.stringify(data)}`);
          try {
            await sqsClient.send(
              new SendMessageCommand({
                QueueUrl: AWS_SQS_CATALOG_ITEMS_QUEUE_URL,
                MessageBody: JSON.stringify(data),
              }),
            );
          } catch (error) {
            reject(error);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // copy parsed object into 'parsed/' bucket folder
    const parsedKey = key.replace(/^uploaded\//, 'parsed/');

    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: parsedKey,
      }),
    );

    // delete parsed object from 'uploaded' bucket folder
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    console.log(`File moved from ${key} to ${parsedKey}`);
  }
};
