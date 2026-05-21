import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { AWS_SNS_CREATE_PRODUCT_TOPIC_ARN } from '../constants';
import { Product } from '../models';

export const publishBatchProductsCreationNotification = async (
  product: Product,
) => {
  const snsClient = new SNSClient({});

  try {
    await snsClient.send(
      new PublishCommand({
        TopicArn: AWS_SNS_CREATE_PRODUCT_TOPIC_ARN,
        Subject: 'Products created',
        Message: JSON.stringify(product, null, 2),
        MessageAttributes: {
          price: {
            DataType: 'Number',
            StringValue: product.price.toString(),
          },
        },
      }),
    );
    console.log('Batch process: product created notification');
  } catch (error) {
    console.log(
      `Products created notification error: ${error instanceof Error ? error.message : 'Unknown error.'} `,
    );
  }
};
