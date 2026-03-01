# mobx-helpers

[![NPM Version](https://img.shields.io/npm/v/mobx-helpers.svg)](https://www.npmjs.com/package/mobx-helpers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


Lightweight MobX utilities for observing property changes and composing disposers.

## Installation

```bash
npm i mobx-helpers mobx
```

Or using bun:

```bash
bun add mobx-helpers mobx
```

> `mobx` is a required peer dependency.

## API

### `onChange(instance, props, callback)`

Reacts to changes on one or more observable properties. Returns a disposer function to stop the reaction.

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

// Track multiple properties at once
const off2 = onChange(store, ['name', 'age'], ({ name, age }) => {
  console.log('Name or age changed:', name, age);
});

// Stop reacting
off();
off2();
```

### `trackChanges(instance, props, callback)`

Like `onChange`, but fires the callback **immediately** with the current values of the tracked properties before listening for changes:

```ts
import { trackChanges } from 'mobx-helpers';

const off = trackChanges(store, ['name', 'age'], (values) => {
  // Both first call and subsequent calls: values === { name, age }
  console.log(values);
});
```

### `combineFns(...fns)`

Combines multiple disposer functions into a single disposer. This is especially useful inside a React `useEffect` when you set up several `onChange` reactions and need to tear them all down in one cleanup function.

```ts
import { combineFns, onChange } from 'mobx-helpers';

// Inside a React component
useEffect(() => {
  const off = combineFns(
    onChange(authStore, 'token', ({ token }) => {
      console.log('Token changed:', token);
    }),
    onChange(settingsStore, 'theme', ({ theme }) => {
      console.log('Theme changed:', theme);
    }),
    onChange(userStore, ['name', 'email'], ({ name, email }) => {
      console.log('User profile updated:', name, email);
    }),
  );

  // Single disposer cleans up all reactions
  return off;
}, []);
```

## Full `useEffect` Example

A common pattern: observe several MobX stores inside a React component and clean up all reactions when the component unmounts.

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

    return off;
  }, []);

  return <div>{/* ... */}</div>;
});
```

## License

MIT
