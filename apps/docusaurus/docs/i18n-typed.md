---
title: i18n-typed
sidebar_position: 5
---

# i18n-typed

`i18n-typed` provides small, type-safe utilities for handle translations with TypeScript. It focuses on template string inference to ensure your translation parameters are always correct.

## Installation

```bash
bun add i18n-typed
```

## toInferredTypedFn

The core utility is `toInferredTypedFn`. It takes a template string and returns a function where the arguments are strictly typed based on the placeholders found in the string.

### Simple Placeholders

Use `{key}` for simple string or number interpolation.

```typescript
import { toInferredTypedFn } from 'i18n-typed';

const welcome = toInferredTypedFn('Welcome, {name}!');

// TypeScript ensures 'name' is required and is a string | number
welcome({ name: 'Roy' }); // "Welcome, Roy!"
```

### ICU-style Plurals

It also supports basic ICU plural rules. The parameter for the plural key is automatically typed as a `number`.

```typescript
const items = toInferredTypedFn(
  '{count, plural, zero {No items} one {1 item} other {# items}}'
);

items({ count: 0 }); // "No items"
items({ count: 1 }); // "1 item"
items({ count: 5 }); // "5 items"
```

### No Placeholders

If a template has no placeholders, the returned function can be called without arguments.

```typescript
const hello = toInferredTypedFn('Hello world');
hello(); // "Hello world"
```

## createProxyWithFallback

Creates a Proxy that gracefully falls back to another object if a property is missing in the target. This is useful for providing default translations or handling missing keys.

```typescript
import { createProxyWithFallback } from 'i18n-typed';

const en = { hello: 'Hello' };
const es = { hello: 'Hola', bye: 'Adiós' };

const i18n = createProxyWithFallback(en, es);

console.log(i18n.hello); // "Hello" (from en)
console.log(i18n.bye);   // "Adiós" (from es fallback)
```

### Using the proxy and toInferredTypedFn to create a translation function

:::tip Professional i18n Solution
By combining `createProxyWithFallback` (for language switching and fallbacks) with `toInferredTypedFn` (for type-safe interpolation), you can build a robust, type-safe i18n solution with zero runtime dependencies and full TypeScript support.
:::

```typescript
import { createProxyWithFallback, toInferredTypedFn } from 'i18n-typed';

const en = { hello: 'Hello', items: toInferredTypedFn('{count, plural, zero {No items} one {1 item} other {# items}}') };
const es = { hello: 'Hola', items: toInferredTypedFn('{count, plural, zero {No items} one {1 item} other {# items}}') };

const t = createProxyWithFallback(en, es);

console.log(t.items({ count: 0 })); // "No items"
console.log(t.items({ count: 1 })); // "1 item"
console.log(t.items({ count: 5 })); // "5 items"
```



