import { MobxRequestor, createRequestor } from '../src/mobx-requestor';

interface Deferred<T> extends Promise<T> {
  resolve: (...args: any) => void;
  reject: (...args: any) => void;
}

const createDeferred = <T>() => {
  let resolver: any;
  let rejector: any;

  const p = new Promise((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });

  (p as any).resolve = (...args: any) => resolver(...args);
  (p as any).reject = (...args: any) => rejector(...args);

  return p as Deferred<T>;
};

describe('mobx-requestor', () => {
  beforeEach(() => {
    // override console.error to mute it
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    // reset console.error
    jest.spyOn(console, 'error').mockRestore();
  });

  test('creating a mobx requestor instance should throw if call is not provided', () => {
    expect(() => {
      // @ts-expect-error
      const rq = new MobxRequestor({}); // eslint-disable-line @typescript-eslint/no-unused-vars
    }).toThrowErrorMatchingInlineSnapshot(`"method to execute is expected as \`call\` parameter"`);
  });

  test('creating a mobx requestor should not throw if the call parameter is provided', async () => {
    const call = async (id: string) => ({ data: [id] });

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const rq = new MobxRequestor<{ data: string[] }, typeof call>({
        call,
      });
    }).not.toThrowError();
  });

  test('call parameter typings should propagate to the execCall handler', async () => {
    const call = async (id: string) => ({ data: [id] });
    const rq = new MobxRequestor<{ data: string[] }, typeof call>({
      call,
    });

    await rq.execCall('someId');

    expect(rq.response?.data?.[0]).toEqual('someId');
  });

  test('custom error could be specified as well', async () => {
    const call = async (id: string) => {
      throw new CustomError(`Custom error ${id}`, 'customTypeError');
    };
    class CustomError extends Error {
      type: string;

      constructor(message: string, type: string) {
        super(message);
        this.type = type;
      }
    }

    const rq = new MobxRequestor<{ data: string[] }, typeof call, CustomError>({
      call,
    });

    await rq.execCall('someId');

    expect(rq.rawError?.type).toEqual('customTypeError');
  });

  test('requestor report loading state while function is being resolved', async () => {
    const dfd = createDeferred();

    const rq = new MobxRequestor({
      call: async () => dfd,
    });

    expect(rq.loading).toEqual(false);

    const p = rq.execCall();

    expect(rq.loading).toEqual(true);

    dfd.resolve({ data: { files: ['file1'] } });

    await p;

    expect(rq.loading).toEqual(false);

    expect(rq.response?.data?.files?.[0] === 'file1');
  });

  test('requestor can handle rejections', async () => {
    const dfd = createDeferred();

    const rq = new MobxRequestor({
      call: async () => dfd,
    });

    expect(rq.loading).toEqual(false);

    const p = rq.execCall();

    expect(rq.loading).toEqual(true);

    dfd.reject(new Error('Missing data'));

    await p;

    expect(rq.loading).toEqual(false);

    expect(rq.error).toEqual('Missing data');

    expect(rq.rawError?.message).toEqual('Missing data');
  });

  test('requestor by default return null as response', async () => {
    const rq = new MobxRequestor({
      call: async () => {},
    });

    expect(rq.response).toEqual(null);
  });

  test('requestor by default will return the value pass as default response', async () => {
    const rq = new MobxRequestor({
      call: async () => '',
      defaultResponse: 'default response',
    });

    expect(rq.response).toEqual('default response');
  });

  test('requestor will change the value to whatever value is returned from the call function', async () => {
    const rq = new MobxRequestor({
      call: async () => ({ data: 'some data' }),
    });

    expect(rq.response).toEqual(null);

    await rq.execCall();

    expect(rq.response).toEqual({ data: 'some data' });
  });

  test('calling clear will return null as the default value', async () => {
    const rq = new MobxRequestor({
      call: async () => ({ data: 'some data' }),
    });

    expect(rq.response).toEqual(null);

    await rq.execCall();

    expect(rq.response).toEqual({ data: 'some data' });

    rq.clearResponse();

    expect(rq.response).toEqual(null);
  });

  test('calling clear will return whatever value was set as default value', async () => {
    const rq = new MobxRequestor({
      call: async () => ({ data: 'some data' }),
      defaultResponse: { data: 'default data' },
    });

    expect(rq.response).toEqual({ data: 'default data' });

    await rq.execCall();

    expect(rq.response).toEqual({ data: 'some data' });

    rq.clearResponse();

    expect(rq.response).toEqual({ data: 'default data' });
  });

  describe('createRequestor', () => {
    it('createRequestor create a mobx requestor from a call function inferring all types needed', async () => {
      const call = async (id: string) => ({ data: [id] });
      const rq = createRequestor({ call });

      // typescript should warn about the missing id parameter
      // @ts-expect-error
      await rq.execCall();

      await rq.execCall('someId');

      // typescript should warn about the fact that someProp does not exist on response
      // @ts-expect-error
      const testResponse = rq.response?.someProp;

      expect(testResponse).toEqual(undefined);

      expect(rq.response?.data?.[0]).toEqual('someId');
    });
  });
});
