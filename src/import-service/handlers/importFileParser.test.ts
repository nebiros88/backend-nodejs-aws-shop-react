import { S3Event } from 'aws-lambda';
import { parseImportedFile } from '../services';
import { importFileParser } from './importFileParser';

jest.mock('../services', () => ({
  parseImportedFile: jest.fn(),
}));

const mockedParseImportedFile = parseImportedFile as jest.Mock;

describe('importFileParser handler', () => {
  const mockEvent: S3Event = {
    Records: [
      {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: 'eu-central-1',
        eventTime: '2026-05-15T10:00:00.000Z',
        eventName: 'ObjectCreated:Put',
        userIdentity: {
          principalId: 'test',
        },
        requestParameters: {
          sourceIPAddress: '127.0.0.1',
        },
        responseElements: {
          'x-amz-request-id': '123',
          'x-amz-id-2': '456',
        },
        s3: {
          s3SchemaVersion: '1.0',
          configurationId: 'test-config',
          bucket: {
            name: 'test-bucket',
            ownerIdentity: {
              principalId: 'test',
            },
            arn: 'arn:aws:s3:::test-bucket',
          },
          object: {
            key: 'uploaded/products.csv',
            size: 100,
            eTag: 'etag',
            sequencer: 'seq',
          },
        },
      },
    ],
  };

  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });
  it('should call parseImportedFile and log success', async () => {
    mockedParseImportedFile.mockResolvedValue(undefined);

    await importFileParser(mockEvent);

    expect(mockedParseImportedFile).toHaveBeenCalledTimes(1);
    expect(mockedParseImportedFile).toHaveBeenCalledWith(mockEvent);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Incoming S3 event:'),
    );
    expect(console.log).toHaveBeenCalledWith(
      'CSV file has been successfully parsed!',
    );
  });

  it('should log error if parseImportedFile throws an error', async () => {
    const errorMessage = 'Parsing failed';
    mockedParseImportedFile.mockRejectedValue(new Error(errorMessage));

    await importFileParser(mockEvent);

    expect(parseImportedFile).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      `importFileParser execution error: ${errorMessage}`,
    );
  });

  it('should handle unknown errors', async () => {
    mockedParseImportedFile.mockRejectedValue('unexpected');

    await importFileParser(mockEvent);

    expect(console.log).toHaveBeenCalledWith(
      'importFileParser execution error: Unknown error',
    );
  });
});
