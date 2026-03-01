import { mock } from 'bun:test';
import path from 'path';

export type ModuleMatcher = string | RegExp;

export const removeFromCache = (modulePath: ModuleMatcher | ModuleMatcher[]) => {
  const paths = Array.isArray(modulePath) ? modulePath : [modulePath];
  
  const cacheKeys = Object.keys(require.cache);
  
  const foundModules: string [] = [];
  
  cacheKeys.forEach((key) => {
    if (paths.some((p) => {
      if (typeof p === 'string') {
        return key.includes(p);
      }
      return p.test(key);
    })) {
      foundModules.push(key);
      
      delete require.cache[key];
    }
  });
  
  if (foundModules.length === 0) {
    console.warn(`No modules found matching ${modulePath}`);
  } else {
    console.log(`Removed ${foundModules.length} modules from cache`);
  }
  
  return foundModules;
};

export type MockEntry = {
  clear: () => void;
};

export class Mocker {
  private entries: MockEntry[] = [];

  async mock(mPath: string, mockFactory:() => any, dir: string) {
    const modulePath = path.resolve(dir, mPath);
    
    const mockResults = mockFactory();
    const result = {
      ...mockResults,
    }
    
    mock.module(modulePath, () => result);
    
    this.entries.push({
      clear: async () => {
        removeFromCache(modulePath);
        const original = await import(modulePath + '?t=' + Date.now());
        mock.module(modulePath, () => original);
      },
    });
  }

  clear() {
    Object.values(this.entries).forEach((entry) => entry.clear());
    this.entries = []
  }
}