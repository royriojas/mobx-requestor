---
sidebar_position: 4
---

# mobx-helpers

`mobx-helpers` is a companion package that provides lightweight utilities for observing MobX observable property changes and composing disposer functions.

## Installation

```bash
npm i mobx-helpers mobx
```

## `onChange`

Reacts to changes on one or more observable properties. Returns a disposer function.

```ts
import { makeAutoObservable } from 'mobx';
import { onChange } from 'mobx-helpers';

class UserStore {
  name = '';
  age = 0;
  constructor() { makeAutoObservable(this); }
}

const store = new UserStore();

// Track a single property
const off = onChange(store, 'name', ({ name }) => {
  console.log('Name changed to', name);
});

// Track multiple properties
const off2 = onChange(store, ['name', 'age'], ({ name, age }) => {
  console.log('Updated:', name, age);
});

// Dispose when no longer needed
off();
off2();
```

## `trackChanges`

Like `onChange`, but fires the callback **immediately** with the current instance before listening for subsequent changes:

```ts
import { trackChanges } from 'mobx-helpers';

const off = trackChanges(store, ['name', 'age'], (values) => {
  // First call: values === store (the full instance)
  // Subsequent calls: values === { name, age }
  console.log(values);
});
```

This is useful when you need to run initialization logic with the current state and then continue reacting to future changes.

## `combineFns`

Combines multiple disposer functions into one. This is the key utility for cleanly managing multiple MobX reactions inside a React `useEffect`.

```ts
import { combineFns } from 'mobx-helpers';

const off = combineFns(disposer1, disposer2, disposer3);

// Calling off() disposes all three
off();
```

## Using with React `useEffect`

The most common and powerful pattern: set up several `onChange` reactions inside a `useEffect` and compose all their disposers with `combineFns` so a single cleanup function tears everything down.

```tsx
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { onChange, combineFns } from 'mobx-helpers';

const Dashboard = observer(({ authStore, projectStore, notifStore }) => {
  useEffect(() => {
    const off = combineFns(
      onChange(authStore, 'user', ({ user }) => {
        analytics.identify(user);
      }),
      onChange(projectStore, ['selectedId', 'filter'], ({ selectedId, filter }) => {
        analytics.track('project_view', { selectedId, filter });
      }),
      onChange(notifStore, 'unreadCount', ({ unreadCount }) => {
        document.title = unreadCount > 0
          ? `(${unreadCount}) Dashboard`
          : 'Dashboard';
      }),
    );

    // Single disposer cleans up all three reactions on unmount
    return off;
  }, []);

  return <div>{/* ... */}</div>;
});
```

:::tip Why `combineFns`?
Without `combineFns`, you'd need to track each disposer individually and call them all in your cleanup function. `combineFns` reduces boilerplate and ensures nothing is accidentally left undisposed.
:::
