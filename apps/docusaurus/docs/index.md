---
sidebar_position: 1
slug: /
---

# milajs

Welcome to **milajs**, a collection of highly optimized, lightweight, and type-safe utilities designed to enhance modern web development workflows. 

## Packages in the Suite

The `milajs` monorepo contains the following packages:

### 🔄 [@milajs/mobx-requestor](./mobx-requestor)
A powerful wrapper around your fetch/axios logic that makes data loading reactively elegant by integrating tightly with [MobX](https://mobx.js.org/). Easily manage loading, success, and error states with zero boilerplate.

### 🛠️ [@milajs/mobx-helpers](./mobx-helpers)
Lightweight utilities for observing MobX observable property changes and composing disposer functions (such as `onChange`, `trackChanges`, and `combineFns`) for seamless integration in React `useEffect` hooks.

### 🌐 [@milajs/i18n-typed](./i18n-typed)
Small, type-safe internationalization utilities. Employs TypeScript template string inference to ensure your translation parameters are strictly typed and always correct, complete with basic ICU plural rules.

### 🍞 [@milajs/bun-mock-dough](./bun-mock-dough)
A utility for mocking modules and overriding properties specifically in a Bun environment, overcoming tricky mock restoration issues in Bun tests.

### 📐 [@milajs/breakpoints-aware](./breakpoints-aware)
Element-level breakpoint detection powered by CSS container queries and `IntersectionObserver`. Fully driven by the browser's own container-query engine with no polling and no `ResizeObserver` needed.
