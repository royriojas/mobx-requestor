import { reaction } from 'mobx';

export type CallbackArgs<T, P extends keyof T> = {
  [K in P]: T[K];
};

/**
 * check for changes on the properties of a mobx observable instance
 */
export const onChange = <T, P extends keyof T>(
  instance: T,
  props: P | P[], // can be a single property or an array of properties to track
  callback: (args: CallbackArgs<T, P>) => void, // this callback will be invoked with the changed values
) =>
  reaction(() => {
    if (typeof props === 'string') {
      // eslint-disable-next-line no-param-reassign
      props = [props];
    }

    const values = (props as string[]).reduce((acc: any, prop) => {
      acc[prop] = instance[prop as keyof T];
      return acc;
    }, {});

    return values;
  }, callback);

export const trackChanges = <T, P extends keyof T>(
  instance: T,
  props: P | P[], // can be a single property or an array of properties to track
  callback: (args: CallbackArgs<T, P>) => void, // this callback will be invoked with the changed values
) => {
  callback(instance);
  return onChange(instance, props, callback);
};
