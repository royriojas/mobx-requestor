# i18n-typed

[![NPM Version](https://img.shields.io/npm/v/i18n-typed.svg)](https://www.npmjs.com/package/i18n-typed)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Type-safe i18n string interpolation for TypeScript. Automatically infers parameter types from your translation templates at compile time — no codegen, no runtime overhead.

## Installation

```bash
npm i i18n-typed
```

Or using bun:

```bash
bun add i18n-typed
```

## Features

- **Zero-dependency** — no runtime dependencies, just TypeScript.
- **Full type inference** — parameter names and types are inferred directly from the template string.
- **Simple placeholders** — `{name}` accepts `string | number`.
- **ICU-style plurals** — `{count, plural, zero {...} one {...} other {...}}` requires `number`.
- **Tiny footprint** — a single function, under 1 KB minified.

## Usage

### Simple Placeholders

```ts
import { toInferredTypedFn } from 'i18n-typed';

const greet = toInferredTypedFn('Hello, {name}! You have {count} new messages.');

// TypeScript infers: (params: { name: string | number; count: string | number }) => string
greet({ name: 'Alice', count: 5 });
// => "Hello, Alice! You have 5 new messages."
```

### ICU-Style Plurals

```ts
const itemsLabel = toInferredTypedFn(
  '{count, plural, zero {No items} one {1 item} other {# items}}'
);

// TypeScript infers: (params: { count: number }) => string
itemsLabel({ count: 0 });  // => "No items"
itemsLabel({ count: 1 });  // => "1 item"
itemsLabel({ count: 42 }); // => "42 items"
```

### Combining Both

```ts
const summary = toInferredTypedFn(
  '{user} has {count, plural, zero {no followers} one {1 follower} other {# followers}}'
);

// TypeScript infers: (params: { user: string | number; count: number }) => string
summary({ user: 'Alice', count: 0 });
// => "Alice has no followers"

summary({ user: 'Bob', count: 1280 });
// => "Bob has 1280 followers"
```

### Using with Translation Objects

A common pattern is to compile all your translation strings at once:

```ts
import { toInferredTypedFn } from 'i18n-typed';

const en = {
  greeting: toInferredTypedFn('Welcome back, {name}!'),
  itemCount: toInferredTypedFn(
    'You have {count, plural, zero {no items} one {1 item} other {# items}} in your cart'
  ),
  transfer: toInferredTypedFn('{sender} sent {amount} to {recipient}'),
} as const;

// All parameters are fully typed
en.greeting({ name: 'Alice' });
en.itemCount({ count: 3 });
en.transfer({ sender: 'Alice', amount: '$50', recipient: 'Bob' });
```

## API

### `toInferredTypedFn<T>(template: T)`

Creates a type-safe interpolation function from a template string.

**Parameters:**
- `template` — A string containing `{placeholder}` and/or `{key, plural, zero {...} one {...} other {...}}` patterns.

**Returns:** `(params: InferredParams<T>) => string`

### `InferredParams<S>`

A utility type that extracts the parameter types from a template string. You can use this independently for type-level operations:

```ts
import type { InferredParams } from 'i18n-typed';

type Params = InferredParams<'Hello, {name}! You have {count} items.'>;
// => { name: string | number; count: string | number }
```

## License

MIT
