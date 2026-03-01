import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { removeFromCache, Mocker } from '../src/mocker';

describe('mocker', () => {
  describe('removeFromCache', () => {
    const fakeModulePaths = [
      '/fake/path/to/moduleA.ts',
      '/fake/path/to/moduleB.ts',
      '/fake/path/to/nested/moduleC.ts',
      '/other/path/moduleD.ts',
    ];

    beforeEach(() => {
      // Seed fake entries in require.cache
      for (const p of fakeModulePaths) {
        require.cache[p] = { id: p, exports: {} } as any;
      }
    });

    afterEach(() => {
      // Clean up any leftover entries
      for (const p of fakeModulePaths) {
        delete require.cache[p];
      }
    });

    test('should remove a single module matching a string', () => {
      const removed = removeFromCache('moduleA');
      expect(removed).toContain('/fake/path/to/moduleA.ts');
      expect(require.cache['/fake/path/to/moduleA.ts']).toBeUndefined();
    });

    test('should remove modules matching a regex', () => {
      const removed = removeFromCache(/\/fake\/path\/to\//);
      expect(removed).toHaveLength(3);
      expect(removed).toContain('/fake/path/to/moduleA.ts');
      expect(removed).toContain('/fake/path/to/moduleB.ts');
      expect(removed).toContain('/fake/path/to/nested/moduleC.ts');
      // moduleD should remain
      expect(require.cache['/other/path/moduleD.ts']).toBeDefined();
    });

    test('should remove modules matching a RegExp instance', () => {
      const removed = removeFromCache(new RegExp('module[A-B]'));
      expect(removed).toHaveLength(2);
      expect(removed).toContain('/fake/path/to/moduleA.ts');
      expect(removed).toContain('/fake/path/to/moduleB.ts');
      expect(require.cache['/fake/path/to/nested/moduleC.ts']).toBeDefined();
    });

    test('should not remove modules if regex does not match', () => {
      const removed = removeFromCache(/nonExistentModule/);
      expect(removed).toHaveLength(0);
      expect(require.cache['/fake/path/to/moduleA.ts']).toBeDefined();
    });

    test('should accept an array of matchers', () => {
      const removed = removeFromCache(['moduleA', /moduleD/]);
      expect(removed).toHaveLength(2);
      expect(removed).toContain('/fake/path/to/moduleA.ts');
      expect(removed).toContain('/other/path/moduleD.ts');
    });

    test('should warn when no modules are found', () => {
      const warnSpy = mock();
      const originalWarn = console.warn;
      console.warn = warnSpy;

      const removed = removeFromCache('nonExistentModule');
      expect(removed).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      console.warn = originalWarn;
    });

    test('should log when modules are removed', () => {
      const logSpy = mock();
      const originalLog = console.log;
      console.log = logSpy;

      const removed = removeFromCache('moduleA');
      expect(removed).toHaveLength(1);
      expect(logSpy).toHaveBeenCalledTimes(1);

      console.log = originalLog;
    });
  });

  describe('Mocker', () => {
    test('should be instantiable', () => {
      const mocker = new Mocker();
      expect(mocker).toBeDefined();
    });

    test('clear should not throw when no mocks have been registered', () => {
      const mocker = new Mocker();
      expect(() => mocker.clear()).not.toThrow();
    });
  });
});
