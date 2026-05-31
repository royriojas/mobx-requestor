# @milajs/breakpoints-aware

Element-level breakpoint detection powered by CSS container queries, CSS animations, and `IntersectionObserver`. **No polling. No `ResizeObserver`.** The browser's own container-query engine drives the detection.

## How it works

1. A hidden **sentry container** (with `container-type: inline-size`) is injected inside the target element.
2. A **sentry element** inside it has CSS custom properties that change via `@container` queries as the element resizes.
3. Each container query toggles between two alternating `@keyframes` animations, ensuring the animation **restarts** on every breakpoint transition.
4. The animation briefly moves the sentry into the `IntersectionObserver` viewport, which fires the `onMatch` callback.
5. The callback reads the cumulative `--matches` CSS custom property to know which breakpoints currently match.

## Usage

```ts
import { onBreakpointsMatch, defaultBreakpoints } from 'breakpoints-aware';

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

## Breakpoints

Breakpoints use a **mobile-first** approach. Values represent the **upper bound** of each breakpoint range. Once a breakpoint matches, it stays matched as the container grows.

```ts
const defaultBreakpoints = {
  xss: 320,   // 0 → 320
  xs: 480,    // 321 → 480
  sm: 690,    // 481 → 690
  md: 850,    // 691 → 850
  lg: 1124,   // 851 → 1124
  xl: 1380,   // 1125 → 1380
  xxl: 1920,  // 1381 → 1920
  xxl2: 2160, // 1921 → ∞
};
```

## API

### `onBreakpointsMatch(ele, options)`

| Param | Type | Description |
|-------|------|-------------|
| `ele` | `string \| HTMLElement` | CSS selector or element reference |
| `options.breakpoints` | `Breakpoints` | Map of breakpoint names → upper bound widths |
| `options.onMatch` | `(result) => void` | Callback fired on every breakpoint transition |

**Returns** a `CleanupFn` that removes all injected DOM and styles.

### `MatchesResult`

| Property | Type | Description |
|----------|------|-------------|
| `all` | `string[]` | All currently matching breakpoint names (ascending) |
| `current` | `string` | The highest matching breakpoint |
| `matches` | `Record<string, boolean>` | Every breakpoint mapped to its match state |
