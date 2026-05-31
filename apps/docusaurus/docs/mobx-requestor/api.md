---
sidebar_position: 3
---

# `MobxRequestor` API Reference

The `MobxRequestor` class encapsulates your async function and provides reactive (MobX observable/computed) properties and actions.

## Constructor

```typescript
new MobxRequestor<T, F, K>({
  callFn: F;               // Required. The async function to wrap.
  autoClear?: boolean;      // Default: true. If true, clears the response before each new call.
  defaultResponse?: T;      // Default: null. The initial and fallback value for `.response`.
  transformError?: (error: K) => string; // Optional. Custom error message transformer.
})
```

## Computed Properties

### `.response: T | null`
Returns the stored response from the last successful call, falling back to `defaultResponse` if no response has been stored yet.

### `.loading: boolean`
`true` while `execCall` is in flight, `false` otherwise.

### `.success: boolean`
`true` if the last call resolved successfully.

### `.initialOrLoading: boolean`
`true` if the requestor is in its initial state (never called) or currently loading.

### `.error: string`
Returns the error message from the last failed call.
- If a `transformError` function was provided, it is used to produce the string.
- Otherwise falls back to `rawError.type`, then `rawError.message`, then `'UNKNONW_ERROR'`.
- Returns `''` (empty string) if there is no error.

### `.rawError: K | null`
The raw error object from the last failed call, or `null`.

### `.uploadComplete: boolean`
`true` when `_uploadProgress` reaches 100.

### `.downloadComplete: boolean`
`true` when `_downloadProgress` reaches 100.

## Actions (Methods)

### `.execCall(...args: Parameters<F>): Promise<void>`
Executes the wrapped async function.
- Accepts the exact same arguments as the original `callFn`.
- Sets `.loading` to `true` during execution.
- On success, sets `.response` to the resolved value and state to `'success'`.
- On failure, sets `.error` / `.rawError` and state to `'error'`.
- If `autoClear` is `true` (the default), resets `.response` to `defaultResponse` at the start of each call.

### `.clearError(): void`
Clears the stored error (`rawError` becomes `null`, `.error` becomes `''`).

### `.clearResponse(): void`
Resets the response and state back to initial (`response` becomes `defaultResponse`, state becomes `'initial'`).

### `.clearErrorAndResponse(): void`
Convenience method that calls both `.clearError()` and `.clearResponse()`.

### `.setResponse(response: T): void`
Manually sets the response and transitions the state to `'success'`.

### `.setResult(args: SetResultParams<T, K, F>): Promise<void>`
Advanced: manually sets the full result (response, state, error) if the fetchId matches the current call.

### `.reportUploadProgress({ percentage: number }): void`
Action to update the upload progress percentage.

### `.reportDownloadProgress({ percentage: number }): void`
Action to update the download progress percentage.

### `.resetUploadProgress(): void`
Resets upload progress to `0`.

### `.resetDownloadProgress(): void`
Resets download progress to `0`.

### `.resetProgressReport(): void`
Resets both upload and download progress to `0`.

## Callback

### `.onError?: (args: { error: K; fetchId: string; params: Parameters<F> }) => void`
Optional callback invoked when `execCall` catches an error. Can be assigned after construction.

## Exported Types

```typescript
export type MobxRequestorState = 'initial' | 'fetching' | 'success' | 'error';

export type MobxRequestorArgs<T, F, K> = {
  callFn: F;
  autoClear?: boolean;
  defaultResponse?: T;
  transformError?: TransformErrorFn<K>;
};

export type SetResultParams<T, K, F> = {
  response: T | null;
  state: MobxRequestorState;
  fetchId: string;
  params: Parameters<F>;
  error?: K | null;
};

export type UploadDownloadProgressArgs = {
  percentage: number;
};
```
