---
sidebar_position: 2
---

# `createRequestor` Helper

`createRequestor` is the recommended way to initialize a `MobxRequestor`. It is a thin factory function that provides excellent TypeScript type inference, automatically deriving the response type from your async function's return type.

## Signature

```typescript
function createRequestor<
  T extends ServiceFn,
  ResponseError extends Error = Error
>(
  args: CreateRequestorOpts<T, ResponseError>
): MobxRequestor<Awaited<ReturnType<T>>, T, ResponseError>
```

Where `CreateRequestorOpts` is the same as `MobxRequestorArgs`:

```typescript
type CreateRequestorOpts<T extends ServiceFn, ResponseError extends Error> = {
  callFn: T;                    // Required. The async function to wrap.
  autoClear?: boolean;          // Default: true.
  defaultResponse?: Awaited<ReturnType<T>>;
  transformError?: (error: ResponseError) => string;
};
```

## Basic Example

```typescript
import { createRequestor } from 'mobx-requestor';

const fetchTodos = async () => {
  const res = await fetch('/api/todos');
  return res.json() as Promise<Todo[]>;
};

const todosRequestor = createRequestor({ callFn: fetchTodos });

// todosRequestor.response is typed as Todo[] | null
await todosRequestor.execCall();
console.log(todosRequestor.response); // Todo[]
```

## Setting a Default Value

Often when dealing with collections, having a `null` response complicates UI logic. Use `defaultResponse` to guarantee a safe initial value:

```typescript
const todosRequestor = createRequestor({
  callFn: fetchTodos,
  defaultResponse: [],
});

// todosRequestor.response is now Todo[] (never null)
console.log(todosRequestor.response); // [] before any call
```

## Custom Error Handling

You can provide a `transformError` function to extract a user-friendly message from your error objects:

```typescript
type ApiError = Error & { code: string; details: string };

const requestor = createRequestor<typeof fetchData, ApiError>({
  callFn: fetchData,
  transformError: (err) => `[${err.code}] ${err.details}`,
});

// requestor.error will now return the formatted string
```

## `SimpleRequestor` Class

For cases where you prefer class inheritance, `SimpleRequestor` is exported as a convenience alias:

```typescript
import { SimpleRequestor } from 'mobx-requestor';

// Equivalent to: new MobxRequestor<Awaited<ReturnType<typeof myFn>>, typeof myFn, Error>(...)
class MyRequestor extends SimpleRequestor<typeof myFn> {
  // add custom logic
}
```
