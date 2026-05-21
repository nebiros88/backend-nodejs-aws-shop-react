import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { AWS_SNS_CREATE_PRODUCT_TOPIC_ARN } from '../constants';

export const publishBatchProductsCreationNotification = async (
  message: string,
) => {
  const snsClient = new SNSClient({});

  try {
    await snsClient.send(
      new PublishCommand({
        TopicArn: AWS_SNS_CREATE_PRODUCT_TOPIC_ARN,
        Subject: 'Products created',
        Message: message,
      }),
    );
    console.log('Products created notification sent');
  } catch (error) {
    console.log(
      `Products created notification error: ${error instanceof Error ? error.message : 'Unknown error.'} `,
    );
  }
};
