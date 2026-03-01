export interface Overrider {
  override(prop: string, newPropValue: any): void;
  restore(): void;
}

const overridenInstances: Array<Overrider> = [];

export const overrideRestore = () => overridenInstances.forEach((ins) => ins.restore());

export const createOverrider = (obj: Record<string, any>, allowNonExistentProps?: boolean) => {
  const originals: Record<string, any> = {};
  const ins = {
    override(prop: string, newPropValue: any) {
      if (!(prop in obj) && !allowNonExistentProps) {
        throw new Error('Only properties that exist could be overriden');
      }
      const objMethod = obj[prop];

      originals[prop] = objMethod;
      
      try {
        obj[prop] = newPropValue;  
      } catch (e) {
        console.error(e);
        Object.defineProperty(obj, prop, {
          value: newPropValue,
          writable: true,
        });
      }
    },
    restore() {
      const keys = Object.keys(originals);
      keys.forEach((key) => {
        obj[key] = originals[key];
      });
    },
  };

  overridenInstances.push(ins);

  return ins;
};

export const override = (
  obj: Record<string, any>,
  propsToOverride: Record<string, any>,
  allowNonExistentProps?: boolean,
) => {
  const ov = createOverrider(obj, allowNonExistentProps);
  Object.keys(propsToOverride).forEach((key) => ov.override(key, propsToOverride[key]));
  return ov;
};
