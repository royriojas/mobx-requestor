# mobx-requestor-monorepo

This repository is a monorepo for the `mobx-requestor` project, an extensible data fetching logic wrapper that observes changes via MobX.

## Packages

- [`mobx-requestor`](./packages/mobx-requestor) - Core fetching and data handling library.

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
import { createRequestor } from 'mobx-requestor';

const userRequestor = createRequestor({
  callFn: (id: string) => fetch(`/api/users/${id}`).then(res => res.json()),
});

await userRequestor.execCall('123');

console.log(userRequestor.loading);  // true while fetching
console.log(userRequestor.response); // the resolved data
console.log(userRequestor.error);    // error message string, or ''
```

> For the full API reference and advanced usage, visit the [documentation site](https://royriojas.github.io/mobx-requestor).
