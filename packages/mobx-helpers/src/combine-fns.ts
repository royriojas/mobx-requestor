export type CustomFn = () => any | (() => Promise<any>) | void;

/**
 * combine multiple functions into one. This is helpful especially when during a useEffect
 * we have used several onChange calls and want to make sure the disposer for each reaction
 * is properly disposed
 *
 * @param fns - functions to combine
 * @returns a function that combines the given functions
 */
export const combineFns =
  (...fns: CustomFn[]) =>
  () => {
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      (async () => {
        try {
          await fn();
        } catch (error) {
          console.error('combineFns error', error);
        }
      })();
    }
  };
