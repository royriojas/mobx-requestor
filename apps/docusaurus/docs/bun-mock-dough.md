---
title: bun-mock-dough
sidebar_position: 6
---

# bun-mock-dough

`bun-mock-dough` is a utility for mocking modules and overriding properties in a Bun environment, to overcome the issues with restoring mocks in Bun. Check https://github.com/oven-sh/bun/issues/7823 for more information.

## Installation

```bash
bun add bun-mock-dough
```

## Mocker

The `Mocker` class is the primary interface for mocking modules. It uses `bun:test`'s `mock.module` under the hood but provides a way to register and clear multiple mocks at once.

```typescript
import { Mocker } from 'bun-mock-dough';

const mocker = new Mocker();

test('my test', async () => {
  // Mock a module relative to the current directory
  await mocker.mock('./my-module', () => ({
    someFunction: () => 'mocked value',
  }), import.meta.dir);

  const myModule = await import('./my-module');
  console.log(myModule.someFunction()); // "mocked value"
});

// Clear all mocks after tests
afterEach(() => {
  mocker.clear();
});
```

## Module Cache Removal

`removeFromCache(modulePath: string | RegExp | Array<string | RegExp>)`

Removes one or more modules from `require.cache`. This is useful for re-triggering side effects in modules or ensuring a fresh import.

```typescript
import { removeFromCache } from 'bun-mock-dough';

removeFromCache('my-module'); // Removes any module path containing "my-module"
removeFromCache(/utils/);     // Removes modules matching the regex
```

## Overriders

Overriders allow you to temporarily change properties or methods on existing objects and restore them later.

### createOverrider

`createOverrider(obj: Record<string, any>, allowNonExistentProps?: boolean)`

Creates a single overrider instance for an object.

```typescript
import { createOverrider } from 'bun-mock-dough';

const config = { api: 'https://api.com' };
const ov = createOverrider(config);

ov.override('api', 'http://localhost:3000');
console.log(config.api); // "http://localhost:3000"

ov.restore();
console.log(config.api); // "https://api.com"
```

### override

`override(obj: Record<string, any>, propsToOverride: Record<string, any>, allowNonExistentProps?: boolean)`

A helper to create an overrider and immediately apply multiple overrides.

```typescript
import { override } from 'bun-mock-dough';

const config = { api: 'https://api.com', timeout: 1000 };
const ov = override(config, {
  api: 'http://localhost:3000',
  timeout: 5000,
});

ov.restore(); // Restores both properties
```
