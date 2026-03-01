# mobx-requestor

[![NPM Version](https://img.shields.io/npm/v/mobx-requestor.svg)](https://www.npmjs.com/package/mobx-requestor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/royriojas/mobx-requestor/actions/workflows/ci.yml/badge.svg)](https://github.com/royriojas/mobx-requestor/actions/workflows/ci.yml)

**mobx-requestor** is a lightweight, type-safe abstraction for managing resource requests in MobX. It simplifies data fetching and state management, providing a consistent way to handle loading, success, and error states without the boilerplate.

## Why use it?

Managing request states (loading, errors, response data) across many components can get messy. `mobx-requestor` wraps your asynchronous calls and provides observable properties that reflect the current state of the request, making it easy to react to changes in your UI.

- ✅ **Type-safe**: Built with TypeScript from the ground up.
- ✅ **Zero Boilerplate**: Automatically manages `loading`, `success`, and `error` states.
- ✅ **Flexible**: Works with any promise-returning function (Axios, Fetch, etc.).
- ✅ **Modern**: Supports both ESM and CommonJS.

## Installation

```bash
bun add mobx-requestor
# or
npm install mobx-requestor
```

## Usage Examples

### 1. Basic Example (The Quick Start)

```typescript
import { MobxRequestor } from 'mobx-requestor'

const getUser = new MobxRequestor({
  callFn: (id: string) => fetch(`/api/users/${id}`).then(res => res.json())
})

// Execute the call
await getUser.execCall('123')

// Reactive state
console.log(getUser.loading) // true while fetching
console.log(getUser.response) // the user data
console.log(getUser.error) // any caught error as string
```

### 2. Advanced TypeScript Usage (Strongly Typed)

Using `mobx-requestor` with specific interfaces ensures you always know what data you're getting back.

```typescript
import { MobxRequestor } from 'mobx-requestor'

interface User {
  id: string
  name: string
  email: string
}

interface UserFilters {
  role?: string
  active?: boolean
}

class UserStore {
  // TypeScript will infer these types correctly from the 'call' function
  usersRequest = new MobxRequestor({
    callFn: async (filters: UserFilters): Promise<User[]> => {
      const response = await api.get('/users', { params: filters })
      return response.data
    },
    defaultResponse: [], // Initial value for .response before any call
    transformError: err =>
      err.response?.data?.message || 'Failed to fetch users'
  })

  async loadUsers() {
    await this.usersRequest.execCall({ active: true })
  }
}

// In your MobX-aware UI:
const store = new UserStore()
if (store.usersRequest.loading) return <Spinner />
if (store.usersRequest.error)
  return <ErrorMessage text={store.usersRequest.error} />

return (
  <ul>
    {store.usersRequest.response.map(user => (
      <li key={user.id}>{user.name}</li>
    ))}
  </ul>
)
```

## API Reference

- `loading`: (Observable) `true` if a request is currently in progress.
- `success`: (Observable) `true` if the last request completed successfully.
- `initialOrLoading`: (Observable) `true` if the request is in its initial state or currently fetching.
- `error`: (Observable) The error message if the last request failed.
- `rawError`: (Observable) The raw error object if the last request failed.
- `response`: (Observable) The data returned from the last successful request (defaults to `null` or `defaultResponse`).
- `uploadComplete`: (Observable) `true` if the upload progress reached 100%.
- `downloadComplete`: (Observable) `true` if the download progress reached 100%.
- `execCall(...args)`: Executes the underlying `callFn` function with the provided arguments.
- `clearResponse()`: Resets the response to the default value.
- `clearError()`: Clears the current error.
- `clearErrorAndResponse()`: Clears both the current error and resets the response.
- `resetProgressReport()`: Resets both upload and download progress to 0.

## Helpers

### `createRequestor` and `SimpleRequestor`

For simpler setups where you want to infer types directly from a function:

```typescript
import { createRequestor } from 'mobx-requestor'

const getUser = async (id: string) => {
  /* ... */
}

const userRequestor = createRequestor({
  callFn: getUser
})
```

## Development

This project uses [Bun](https://bun.sh) for development and testing.

```bash
# Build (generates CJS and ESM)
bun run build

# Run tests
bun test

# Linting
bun run lint
```

## License

MIT
