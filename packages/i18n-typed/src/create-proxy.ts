import { console } from './globals';

export const createProxyWithFallback = <T>(target: T, fallback: T): T => {
  const wm = new WeakMap();

  const handler = {
    get(objTarget: object, prop: string | symbol, receiver: any) {
      const sourceValue = Reflect.get(objTarget, prop, receiver);

      let value = sourceValue;

      const fallbackObj = Reflect.get(fallback ?? {}, prop, receiver);

      if (value === undefined && typeof prop !== 'symbol') {
        if (fallbackObj) {
          const propToUse = String(prop);

          if (!propToUse.match(/^Symbol\(/)) {
            // eslint-disable-next-line no-console
            console.info(`>>> value for "${propToUse}" not found in source, retrieving it from fallback`);
          }
          value = fallbackObj;
        }
      }

      if (Object(value) !== value || typeof value === 'function') {
        return value;
      }

      if (!wm.has(value)) {
        wm.set(value, createProxyWithFallback(value, fallbackObj));
      }

      return wm.get(value);
    },
  };

  return new Proxy(target as object, handler) as T;
};
