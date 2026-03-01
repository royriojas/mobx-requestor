import { describe, it, expect, beforeEach, jest, afterEach } from 'bun:test';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Mocker } from 'bun-mocker';
import { createProxyWithFallback } from '../src/create-proxy';

interface Baz {
  baz: number;
}

interface Source {
  some: {
    foo?: {
      bar: Baz[];
    };
    baz?: {
      foo: string;
    };
    foo2?: string;
  };
}

describe('proxy-with-fallback', () => {
  let consoleInfoMock: ReturnType<typeof jest.fn>;
  let mocker: Mocker;
  beforeEach(() => {
    consoleInfoMock = jest.fn();
    mocker = new Mocker();
    mocker.mock('../src/globals', () => ({ console: { info: consoleInfoMock } }), __dirname);
  });

  afterEach(() => mocker.clear());

  it('should return the values from the target and if not found there it should use the fallback object if process.env.NODE_ENV !== `staging` or `production`', () => {
    const source: Source = {
      some: {
        foo: {
          bar: [{ baz: 1 }, { baz: 2 }],
        },
      },
    };

    const fallback: Source = {
      some: {
        baz: {
          foo: 'bar',
        },
      },
    };

    const p = createProxyWithFallback<Source>(source, fallback);

    expect(p.some?.foo?.bar?.[0].baz).toEqual(1);
    expect(p.some?.baz?.foo).toEqual('bar');

    expect(consoleInfoMock).toHaveBeenCalledWith('>>> value for "baz" not found in source, retrieving it from fallback');
  });

  it('should return the values from the target and if not found there it should use the fallback object without showing nothing in console in staging', () => {
    const source: Source = {
      some: {
        foo: {
          bar: [{ baz: 1 }, { baz: 2 }],
        },
      },
    };

    const fallback: Source = {
      some: {
        baz: {
          foo: 'bar',
        },
      },
    };

    const p = createProxyWithFallback<Source>(source, fallback);

    expect(p.some?.foo?.bar?.[0].baz).toEqual(1);
    expect(p.some?.baz?.foo).toEqual('bar');

    expect(consoleInfoMock).not.toHaveBeenCalled();
  });

  it('should return the values from the target and if not found there it should use the fallback object without showing nothing in console in production', () => {
    const source: Source = {
      some: {
        foo: {
          bar: [{ baz: 1 }, { baz: 2 }],
        },
      },
    };

    const fallback: Source = {
      some: {
        baz: {
          foo: 'bar',
        },
      },
    };

    const p = createProxyWithFallback<Source>(source, fallback);

    expect(p.some?.foo?.bar?.[0].baz).toEqual(1);
    expect(p.some?.baz?.foo).toEqual('bar');

    expect(consoleInfoMock).not.toHaveBeenCalled();
  });

  describe('if value does not exist either in source or fallback', () => {
    it('should return undefined at the first value not found', () => {
      const source: Source = {
        some: {
          foo: {
            bar: [{ baz: 1 }, { baz: 2 }],
          },
        },
      };

      const fallback: Source = {
        some: {
          baz: {
            foo: 'bar',
          },
        },
      };

      const p = createProxyWithFallback<Source>(source, fallback);

      expect(p.some?.foo2).toEqual(undefined);
    });
  });

  it('should always return the same instance for the missing key in the source', () => {
    const source = {
      demo1: {
        foo: 'bar',
      },
      demo2: {
        baz: 'baz',
      },
    };

    const fallback = {
      demo3: {
        foo: 'bar',
      },
      demo4: {
        baz: 'baz',
      },
    };

    const p = createProxyWithFallback(source, fallback as unknown as typeof source);

    // @ts-expect-error
    const s = p.demo3;

    expect(s.foo).toEqual('bar');

    // @ts-expect-error
    expect(p.demo3).toEqual(p.demo3);
  });
});
