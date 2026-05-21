import { SQSEvent } from 'aws-lambda';
import { catalogBatchProcess } from './catalogBatchProcess';
import {
  createNewProduct,
  publishBatchProductsCreationNotification,
} from '../services';
import { validateCreateProductDto } from '../utils';

jest.mock('../services', () => ({
  createNewProduct: jest.fn(),
  publishBatchProductsCreationNotification: jest.fn(),
}));

jest.mock('../utils', () => ({
  validateCreateProductDto: jest.fn(),
}));

const mockedCreateNewProduct = createNewProduct as jest.Mock;
const mockedPublishBatchProductsCreationNotification =
  publishBatchProductsCreationNotification as jest.Mock;
const mockedValidateCreateProductDto = validateCreateProductDto as jest.Mock;

describe('catalogBatchProcess handler', () => {
  beforeEach(() => jest.clearAllMocks());

  const validDto = {
    title: 'Product 1',
    description: 'Products 1 description',
    price: 66,
    count: 20,
  };

  const createdProduct = {
    id: '1',
    ...validDto,
  };

  const createSQSEvent = (records: Array<unknown>): SQSEvent => ({
    Records: records.map((body, idx) => ({
      messageId: `msg-${idx}`,
      receiptHandle: '',
      body: JSON.stringify(body),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '',
        SenderId: '',
        ApproximateFirstReceiveTimestamp: '',
      },
      messageAttributes: {},
      md5OfBody: '',
      eventSource: 'aws:sqs',
      eventSourceARN: '',
      awsRegion: 'eu-central-1',
    })),
  });

  it('should process valid records and publish notification', async () => {
    mockedValidateCreateProductDto.mockReturnValue({
      isValid: true,
      errors: null,
    });

    const event = createSQSEvent([validDto]);

    mockedCreateNewProduct.mockResolvedValue(createdProduct);

    const result = await catalogBatchProcess(event);

    expect(mockedValidateCreateProductDto).toHaveBeenCalledWith(validDto);
    expect(mockedCreateNewProduct).toHaveBeenCalledWith(validDto);
    expect(mockedPublishBatchProductsCreationNotification).toHaveBeenCalledWith(
      JSON.stringify([createdProduct], null, 2),
    );
    expect(result).toEqual({
      batchItemFailures: [],
    });
  });

  it('should return batch failure for invalid dto', async () => {
    mockedValidateCreateProductDto.mockReturnValue({
      isValid: false,
      errors: ['validation error'],
    });

    const event = createSQSEvent([validDto]);
    const result = await catalogBatchProcess(event);

    expect(mockedCreateNewProduct).not.toHaveBeenCalled();
    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: 'msg-0' }],
    });
    expect(
      mockedPublishBatchProductsCreationNotification,
    ).not.toHaveBeenCalled();
  });

  it('should return batch failure if createNewProduct throws an error', async () => {
    const ERROR_MESSAGE = 'something wrong';
    mockedValidateCreateProductDto.mockReturnValue({
      isValid: true,
      errors: null,
    });
    mockedCreateNewProduct.mockRejectedValue(new Error(ERROR_MESSAGE));

    const event = createSQSEvent([validDto]);
    const result = await catalogBatchProcess(event);

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: 'msg-0' }],
    });
    expect(
      mockedPublishBatchProductsCreationNotification,
    ).not.toHaveBeenCalled();
  });

  it('should not publish if no products created', async () => {
    mockedValidateCreateProductDto.mockReturnValue({
      isValid: false,
      errors: ['validation error'],
    });

    const event = createSQSEvent([validDto]);
    await catalogBatchProcess(event);

    expect(
      mockedPublishBatchProductsCreationNotification,
    ).not.toHaveBeenCalled();
  });

  it('should process mixed valid and invalid records', async () => {
    mockedValidateCreateProductDto
      .mockReturnValueOnce({
        isValid: true,
        errors: null,
      })
      .mockReturnValueOnce({
        isValid: false,
        errors: ['validation error'],
      });

    mockedCreateNewProduct.mockResolvedValue(createdProduct);

    const event = createSQSEvent([validDto, validDto]);
    const result = await catalogBatchProcess(event);

    expect(mockedCreateNewProduct).toHaveBeenCalledTimes(1);
    expect(mockedPublishBatchProductsCreationNotification).toHaveBeenCalled();
    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: 'msg-1' }],
    });
  });
});
