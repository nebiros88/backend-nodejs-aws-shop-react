import { APIGatewayTokenAuthorizerEvent, Context } from 'aws-lambda';
import { basicAuthorizer } from './basicAuthorizer';
import { generatePolicy } from '../services';

jest.mock('../services', () => ({
  generatePolicy: jest.fn(),
}));

describe('basicAuthorizer', () => {
  const ORIGIN_ENV = process.env;
  const mockedGeneratePolicy = generatePolicy as jest.Mock;
  const testArn = 'test-arn';
  const userName = 'test-user';
  const userPassword = 'test-password';

  const encodedToken = Buffer.from(
    `${userName}:${userPassword}`,
    'utf-8',
  ).toString('base64');

  const mockedDenyPolicy = {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: testArn,
        },
      ],
    },
  };

  beforeEach(() => {
    jest.resetModules();

    process.env = {
      ...ORIGIN_ENV,
      [userName]: userPassword,
    };
  });

  afterEach(() => {
    process.env = ORIGIN_ENV;
    jest.clearAllMocks();
  });

  it(`should return alow policy for authorized request`, async () => {
    const mockedAllowPolicy = {
      principalId: userName,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: testArn,
          },
        ],
      },
    };
    mockedGeneratePolicy.mockReturnValue(mockedAllowPolicy);

    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      methodArn: 'test-arn',
      authorizationToken: `Basic ${encodedToken}`,
    };

    const result = await basicAuthorizer(event, {} as Context);

    expect(mockedGeneratePolicy).toHaveBeenCalledWith(
      userName,
      'Allow',
      testArn,
    );
    expect(result).toEqual(mockedAllowPolicy);
  });

  it('should return unauthorized', async () => {
    const event = {
      type: 'TOKEN',
      methodArn: 'test-arn',
      authorizationToken: undefined,
    } as unknown as APIGatewayTokenAuthorizerEvent;

    await expect(basicAuthorizer(event, {} as Context)).rejects.toThrow(
      'Unauthorized',
    );

    expect(mockedGeneratePolicy).not.toHaveBeenCalled();
  });

  it('should return deny policy for the wrong scheme', async () => {
    mockedGeneratePolicy.mockReturnValue(mockedDenyPolicy);

    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      methodArn: 'test-arn',
      authorizationToken: `Wrong-scheme ${encodedToken}`,
    };

    const result = await basicAuthorizer(event, {} as Context);

    expect(mockedGeneratePolicy).toHaveBeenCalledWith('user', 'Deny', testArn);
    expect(result).toEqual(mockedDenyPolicy);
  });

  it('should return deny policy for the wrong token', async () => {
    mockedGeneratePolicy.mockReturnValue(mockedDenyPolicy);

    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      methodArn: 'test-arn',
      authorizationToken: 'Basic wrong-token',
    };

    const result = await basicAuthorizer(event, {} as Context);

    expect(mockedGeneratePolicy).toHaveBeenCalledWith('user', 'Deny', testArn);
    expect(result).toEqual(mockedDenyPolicy);
  });

  it('should return deny policy for the wrong user name', async () => {
    mockedGeneratePolicy.mockReturnValue(mockedDenyPolicy);

    const encodedToken = Buffer.from(
      `wrong-user-name:${userPassword}`,
      'utf-8',
    ).toString('base64');

    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      methodArn: 'test-arn',
      authorizationToken: `Basic ${encodedToken}`,
    };

    const result = await basicAuthorizer(event, {} as Context);

    expect(mockedGeneratePolicy).toHaveBeenCalledWith(
      'wrong-user-name',
      'Deny',
      testArn,
    );
    expect(result).toEqual(mockedDenyPolicy);
  });

  it('should return deny policy for the wrong user password', async () => {
    mockedGeneratePolicy.mockReturnValue(mockedDenyPolicy);

    const encodedToken = Buffer.from(
      `${userName}:wrong-password`,
      'utf-8',
    ).toString('base64');

    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      methodArn: 'test-arn',
      authorizationToken: `Basic ${encodedToken}`,
    };

    const result = await basicAuthorizer(event, {} as Context);

    expect(mockedGeneratePolicy).toHaveBeenCalledWith(
      userName,
      'Deny',
      testArn,
    );
    expect(result).toEqual(mockedDenyPolicy);
  });

  it('should return deny policy for the wrong decoded credentials scheme', async () => {
    mockedGeneratePolicy.mockReturnValue(mockedDenyPolicy);

    const encodedToken = Buffer.from(
      `${userName}${userPassword}`, // removed colon sign
      'utf-8',
    ).toString('base64');

    const event: APIGatewayTokenAuthorizerEvent = {
      type: 'TOKEN',
      methodArn: 'test-arn',
      authorizationToken: `Basic ${encodedToken}`,
    };

    const result = await basicAuthorizer(event, {} as Context);

    expect(mockedGeneratePolicy).toHaveBeenCalledWith('user', 'Deny', testArn);
    expect(result).toEqual(mockedDenyPolicy);
  });
});
