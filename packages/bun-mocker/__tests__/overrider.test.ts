import { describe, test, expect, beforeEach } from 'bun:test';
import { createOverrider, override, overrideRestore } from '../src/overrider';

describe('overrider', () => {
  describe('create', () => {
    let obj: Record<string, any>;

    beforeEach(() => {
      obj = { name: 'Alice', age: 30, greet: () => 'hello' };
    });

    test('should override an existing property', () => {
      const ov = createOverrider(obj);
      ov.override('name', 'Bob');
      expect(obj.name).toBe('Bob');
    });

    test('should restore overridden properties', () => {
      const ov = createOverrider(obj);
      ov.override('name', 'Bob');
      ov.override('age', 99);
      expect(obj.name).toBe('Bob');
      expect(obj.age).toBe(99);

      ov.restore();
      expect(obj.name).toBe('Alice');
      expect(obj.age).toBe(30);
    });

    test('should throw when overriding a non-existent property', () => {
      const ov = createOverrider(obj);
      expect(() => ov.override('nonExistent', 'value')).toThrow(
        'Only properties that exist could be overriden',
      );
    });

    test('should allow overriding non-existent properties when allowNonExistentProps is true', () => {
      const ov = createOverrider(obj, true);
      ov.override('brand', 'new-value');
      expect(obj.brand).toBe('new-value');
    });

    test('should restore non-existent properties to undefined', () => {
      const ov = createOverrider(obj, true);
      ov.override('brand', 'new-value');
      expect(obj.brand).toBe('new-value');

      ov.restore();
      expect(obj.brand).toBeUndefined();
    });

    test('should override a function property', () => {
      const ov = createOverrider(obj);
      ov.override('greet', () => 'goodbye');
      expect(obj.greet()).toBe('goodbye');

      ov.restore();
      expect(obj.greet()).toBe('hello');
    });

    test('should handle overriding the same property multiple times', () => {
      const ov = createOverrider(obj);
      ov.override('name', 'Bob');
      ov.override('name', 'Charlie');
      expect(obj.name).toBe('Charlie');

      // restore should bring back the value at the time of the LAST override call
      // (which stored 'Bob' as the original)
      ov.restore();
      expect(obj.name).toBe('Bob');
    });
  });

  describe('override (convenience function)', () => {
    test('should override multiple properties at once', () => {
      const obj = { x: 1, y: 2, z: 3 };
      const ov = override(obj, { x: 10, z: 30 });

      expect(obj.x).toBe(10);
      expect(obj.y).toBe(2);
      expect(obj.z).toBe(30);

      ov.restore();
      expect(obj.x).toBe(1);
      expect(obj.y).toBe(2);
      expect(obj.z).toBe(3);
    });

    test('should pass allowNonExistentProps through', () => {
      const obj: Record<string, any> = { a: 1 };
      const ov = override(obj, { a: 2, b: 3 }, true);

      expect(obj.a).toBe(2);
      expect(obj.b).toBe(3);

      ov.restore();
      expect(obj.a).toBe(1);
      expect(obj.b).toBeUndefined();
    });

    test('should throw when overriding non-existent props without allowNonExistentProps', () => {
      const obj = { a: 1 };
      expect(() => override(obj, { a: 2, b: 3 } as any)).toThrow(
        'Only properties that exist could be overriden',
      );
    });
  });

  describe('overrideRestore', () => {
    test('should restore all overridden instances globally', () => {
      const obj1 = { val: 'original1' };
      const obj2 = { val: 'original2' };

      createOverrider(obj1).override('val', 'changed1');
      createOverrider(obj2).override('val', 'changed2');

      expect(obj1.val).toBe('changed1');
      expect(obj2.val).toBe('changed2');

      overrideRestore();

      expect(obj1.val).toBe('original1');
      expect(obj2.val).toBe('original2');
    });
  });
});
