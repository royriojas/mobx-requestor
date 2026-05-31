---
sidebar_position: 1
---

# Introduction

**@milajs/mobx-requestor** is a powerful wrapper around your fetch/axios logic that makes data loading reactively elegant by integrating tightly with [MobX](https://mobx.js.org/).

## Why use @milajs/mobx-requestor?

When fetching data in modern UI frameworks, developers often have to manage repetitive boilerplate for loading states, error handling, and success scenarios.

With `@milajs/mobx-requestor`, you wrap your fetching function into a reactive store. MobX will automatically track when the function is executing, when it has resolved, and if any errors occurred—making it effortless to build responsive and resilient UIs.

## Installation

```bash
npm i @milajs/mobx-requestor mobx
```

Or using bun:
```bash
bun add @milajs/mobx-requestor mobx
```

> Note: `mobx` is a required peer dependency.

## Basic Usage

The primary export from `@milajs/mobx-requestor` is the `createRequestor` function. It takes an options object containing a `callFn` and returns a reactive `MobxRequestor` instance.

```typescript
import { createRequestor } from '@milajs/mobx-requestor';
import { observer } from 'mobx-react'; // Or mobx-react-lite

// 1. Define your fetch logic (this can be axios, fetch, etc.)
const fetchUserById = async (id: string) => {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
};

// 2. Wrap it with `createRequestor`
const userRequestor = createRequestor({ callFn: fetchUserById });

// 3. Use it in a reactive component
const UserProfile = observer(({ userId }) => {
  if (userRequestor.loading) {
    return <div>Loading user {userId}...</div>;
  }

  if (userRequestor.error) {
    return <div>Error loading user: {userRequestor.error}</div>;
  }

  const user = userRequestor.response;

  if (!user) {
    return <button onClick={() => userRequestor.execCall(userId)}>Load User</button>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
    </div>
  );
});
```
