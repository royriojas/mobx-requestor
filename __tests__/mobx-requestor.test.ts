import { MobxRequestor } from '../src/mobx-requestor';

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
  test('creating a mobx requestor instance should throw if call is not provided', () => {
    expect(() => {
      // @ts-expect-error
      const rq = new MobxRequestor({}); // eslint-disable-line @typescript-eslint/no-unused-vars
    }).toThrowErrorMatchingInlineSnapshot(`"\\"call\\" parameter not provided"`);
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
});
