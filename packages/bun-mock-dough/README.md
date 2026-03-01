# bun-mock-dough

[![NPM Version](https://img.shields.io/npm/v/bun-mock-dough.svg)](https://www.npmjs.com/package/bun-mock-dough)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`bun-mock-dough` is a utility for mocking modules and overriding properties in a Bun environment. It provides a more flexible way to mock dependencies and clean up after tests, specifically addressing issues where restoring mocks in Bun can be tricky.

## Installation

```bash
bun add bun-mock-dough
```

## Features

- **Module Mocking** — Easily mock ES modules in Bun tests.
- **Cache Management** — Manually remove modules from `require.cache`.
- **Property Overriders** — Temporarily override object properties and methods.
- **Auto Cleanup** — Tools to ensure tests don't leak state.

## Usage

### Mocker

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

### Module Cache Removal

`removeFromCache(modulePath: string | RegExp | Array<string | RegExp>)`

Removes one or more modules from `require.cache`. This is useful for re-triggering side effects in modules or ensuring a fresh import.

```typescript
import { removeFromCache } from 'bun-mock-dough';

removeFromCache('my-module'); // Removes any module path containing "my-module"
removeFromCache(/utils/);     // Removes modules matching the regex
```

### Overriders

Overriders allow you to temporarily change properties or methods on existing objects and restore them later.

#### createOverrider

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

#### override

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

## License

MIT
