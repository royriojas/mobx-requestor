# milajs

[![Build Status](https://github.com/royriojas/milajs/workflows/CI/badge.svg)](https://github.com/royriojas/milajs/actions)


## Packages

- [`@milajs/mobx-requestor`](./packages/mobx-requestor) - Core fetching and reactive data wrapper library.
- [`@milajs/mobx-helpers`](./packages/mobx-helpers) - Lightweight MobX utilities for observing property changes.
- [`@milajs/i18n-typed`](./packages/i18n-typed) - Type-safe i18n string interpolation.
- [`@milajs/bun-mock-dough`](./packages/bun-mock-dough) - Utilities for module mocking and property overriders in Bun.
- [`@milajs/breakpoints-aware`](./packages/breakpoints-aware) - Container query-driven element breakpoint detection.

## Getting Started

```bash
# Install dependencies
bun install

# Build the packages
bun run build

# Run the tests
bun run test
```

## Basic Usage

```typescript
import { createRequestor } from '@milajs/mobx-requestor';

const userRequestor = createRequestor({
  callFn: (id: string) => fetch(`/api/users/${id}`).then(res => res.json()),
});

await userRequestor.execCall('123');

console.log(userRequestor.loading);  // true while fetching
console.log(userRequestor.response); // the resolved data
console.log(userRequestor.error);    // error message string, or ''
```

> For the full API reference and advanced usage, visit the [documentation site](https://royriojas.github.io/milajs).
