import { makeAutoObservable, configure, runInAction } from 'mobx';
import { describe, test, jest, expect } from 'bun:test';
import { onChange, trackChanges } from '../src';

// Ensure mobx does not enforce actions for simpler test setup
configure({ enforceActions: 'never' });

const wait = (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));

class TestStore {
  name = 'initial';

  count = 0;

  active = false;

  constructor() {
    makeAutoObservable(this);
  }
}

describe('mobx-helpers', () => {
  describe('onChange', () => {
    test('should fire callback when a tracked property changes', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      onChange(store, 'name', callback);

      store.name = 'updated';

      await wait();

      expect(callback).toHaveBeenCalledTimes(1);
      // reaction passes (newValue, oldValue, reaction) — check first arg
      expect(callback.mock.calls[0]![0]).toEqual({ name: 'updated' });
    });

    test('should not fire callback if tracked property has not changed', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      onChange(store, 'name', callback);

      store.count = 5; // change a non-tracked property

      await wait();

      expect(callback).not.toHaveBeenCalled();
    });

    test('should track multiple properties', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      onChange(store, ['name', 'count'], callback);

      runInAction(() => {
        store.name = 'updated';
        store.count = 42;
      });

      await wait();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0]![0]).toEqual({ name: 'updated', count: 42 });
    });

    test('should fire callback each time a tracked property changes', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      onChange(store, 'count', callback);

      store.count = 1;
      await wait();

      store.count = 2;
      await wait();

      store.count = 3;
      await wait();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback.mock.calls[0]![0]).toEqual({ count: 1 });
      expect(callback.mock.calls[1]![0]).toEqual({ count: 2 });
      expect(callback.mock.calls[2]![0]).toEqual({ count: 3 });
    });

    test('should return a disposer that stops the reaction', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      const dispose = onChange(store, 'name', callback);

      store.name = 'first';
      await wait();

      expect(callback).toHaveBeenCalledTimes(1);

      dispose();

      store.name = 'second';
      await wait();

      // should not fire again after disposal
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should track boolean property changes', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      onChange(store, 'active', callback);

      store.active = true;
      await wait();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0]![0]).toEqual({ active: true });
    });

    test('should handle a single property passed as string', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      onChange(store, 'name', callback);

      store.name = 'changed';
      await wait();

      expect(callback.mock.calls[0]![0]).toEqual({ name: 'changed' });
    });
  });

  describe('trackChanges', () => {
    test('should invoke callback immediately with current instance', () => {
      const store = new TestStore();
      const callback = jest.fn();

      trackChanges(store, 'name', callback);

      // callback should have been called synchronously with the instance
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0]![0]).toBe(store);
    });

    test('should invoke callback immediately and then on subsequent changes', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      trackChanges(store, 'count', callback);

      // initial call
      expect(callback).toHaveBeenCalledTimes(1);

      store.count = 10;
      await wait();

      // initial call + reaction
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[1]![0]).toEqual({ count: 10 });
    });

    test('should return a disposer that stops the reaction but does not undo the initial call', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      const dispose = trackChanges(store, 'name', callback);

      // initial call
      expect(callback).toHaveBeenCalledTimes(1);

      dispose();

      store.name = 'after-dispose';
      await wait();

      // should still be 1 — no reaction after dispose
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should track multiple properties and fire initial + change callbacks', async () => {
      const store = new TestStore();
      const callback = jest.fn();

      trackChanges(store, ['name', 'active'], callback);

      // initial callback with the full instance
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0]![0]).toBe(store);

      runInAction(() => {
        store.name = 'new';
        store.active = true;
      });
      await wait();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[1]![0]).toEqual({ name: 'new', active: true });
    });
  });
});
