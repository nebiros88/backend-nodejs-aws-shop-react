import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  AWS_S3_IMPORT_BUCKET_REGION,
  AWS_S3_IMPORT_BUCKET_NAME,
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
