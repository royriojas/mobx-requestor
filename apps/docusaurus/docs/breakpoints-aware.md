---
title: "@milajs/breakpoints-aware"
sidebar_position: 6
---

# @milajs/breakpoints-aware

Element-level breakpoint detection powered by CSS container queries, CSS animations, and `IntersectionObserver`. **No polling. No `ResizeObserver`.** The browser's own container-query engine drives the detection.

## How it works

1. A hidden **sentry container** (with `container-type: inline-size`) is injected inside the target element.
2. A **sentry element** inside it has CSS custom properties that change via `@container` queries as the element resizes.
3. Each container query toggles between two alternating `@keyframes` animations, ensuring the animation **restarts** on every breakpoint transition.
4. The animation briefly moves the sentry into the `IntersectionObserver` viewport, which fires the `onMatch` callback.
5. The callback reads the cumulative `--matches` CSS custom property to know which breakpoints currently match.

## Installation

```bash
bun add @milajs/breakpoints-aware
```

Or using npm:
```bash
npm i @milajs/breakpoints-aware
```

## Usage

```ts
import { onBreakpointsMatch, defaultBreakpoints } from '@milajs/breakpoints-aware';

const cleanup = onBreakpointsMatch('.my-card', {
  breakpoints: defaultBreakpoints,
  onMatch({ matches }) {
    console.log(matches.current);  // e.g. 'md'
    console.log(matches.all);      // e.g. ['xss', 'xs', 'sm', 'md']
    console.log(matches.matches);  // e.g. { xss: true, xs: true, sm: true, md: true, lg: false, ... }
  },
});

// Later, to stop observing:
cleanup();
```

## Breakpoints & Mobile-First Logic

The library uses a strictly **mobile-first** approach. Under the hood, breakpoint ranges are compiled into `min-width` container query rules:

1. The first (smallest) breakpoint always starts matching at `min-width: 0px`.
2. Each subsequent breakpoint activates at **`(previous breakpoint upper bound) + 1`**.
3. Once a breakpoint is activated, it remains matched as the element grows (matches accumulate in `result.all`).

### The Final Breakpoint matches to Infinity
Because the query thresholds are calculated relative to the previous breakpoint's upper bound, the **final (largest) breakpoint defined will always match up to infinity** (as there is no subsequent breakpoint to limit it).

The numeric value assigned to the final key represents its defined upper bound. If you add a larger breakpoint in the future, this value will be used to calculate the starting threshold of that new breakpoint. However, as long as it remains the last item in the list, the last breakpoint stays active indefinitely past the second-to-last breakpoint's boundary.

```ts
const defaultBreakpoints = {
  xss: 320,   // Active from 0px → 320px
  xs: 480,    // Active from 321px → 480px
  sm: 690,    // Active from 481px → 690px
  md: 850,    // Active from 691px → 850px
  lg: 1124,   // Active from 851px → 1124px
  xl: 1380,   // Active from 1125px → 1380px
  xxl: 1920,  // Active from 1381px → 1920px
  xxl2: 2160, // Active from 1921px → ∞ (2160 acts as the upper bound if a larger key is added)
};
```

## API

### `onBreakpointsMatch<T extends Breakpoints>(ele, options)`

| Param | Type | Description |
|-------|------|-------------|
| `ele` | `string \| HTMLElement` | CSS selector or element reference |
| `options.breakpoints` | `T` | Map of custom breakpoint names → upper bound widths |
| `options.onMatch` | `(result: MatchesResult<T>) => void` | Callback fired on every breakpoint transition |

**Returns** a `CleanupFn` that removes all injected DOM and styles.

### `MatchesResult<T extends Breakpoints>`

| Property | Type | Description |
|----------|------|-------------|
| `all` | `(keyof T)[]` | All currently matching breakpoint names (ascending) |
| `current` | `keyof T` | The highest matching breakpoint name |
| `matches` | `Record<keyof T, boolean>` | Every breakpoint mapped to its match state |

---

## TypeScript Type Safety

`onBreakpointsMatch` is fully generic. When you pass custom breakpoints (typically defined as `as const`), TypeScript automatically infers the keys of your breakpoints object and propagates them directly to the callback `result`:

```ts
const myBreakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
} as const;

onBreakpointsMatch('.my-card', {
  breakpoints: myBreakpoints,
  onMatch(result) {
    // result.current is strictly typed as 'mobile' | 'tablet' | 'desktop'
    console.log(result.current); 

    // result.matches has strictly typed keys: Record<'mobile' | 'tablet' | 'desktop', boolean>
    if (result.matches.tablet) {
      console.log('We are on tablet or higher!');
    }
  },
});
```

