import type {
  Breakpoints,
  CleanupFn,
  MatchesResult,
  OnBreakpointsMatchOptions,
} from './types';
import styles from './breakpoints-aware.module.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let counter = 0;

/** Generate a short unique id to namespace injected CSS / DOM. */
export function uid(): string {
  return `ba-${Date.now().toString(36)}-${(counter++).toString(36)}`;
}

/**
 * Sort breakpoint entries by their numeric value (ascending).
 * Returns tuples of [name, upperBound].
 */
function sortedBreakpoints(bp: Breakpoints): [string, number][] {
  return Object.entries(bp).sort((a, b) => a[1] - b[1]);
}

/**
 * Compute the min-width threshold that activates each breakpoint.
 *
 * Mobile-first rule:
 *  - The first (smallest) breakpoint always matches → min-width: 0
 *  - Each subsequent breakpoint activates at (previous upper bound + 1)
 */
function computeMinWidths(sorted: [string, number][]): number[] {
  return sorted.map((_, i) => (i === 0 ? 0 : sorted[i - 1][1] + 1));
}

// ---------------------------------------------------------------------------
// Per-instance CSS generation (only dynamic rules)
// ---------------------------------------------------------------------------

/**
 * Build the CSS that is unique to each `onBreakpointsMatch` call:
 *   - One `@container` rule per breakpoint, setting CSS vars on the
 *     sentry via its `data-ba-id` attribute
 *
 * Keyframes and static sentry styles come from the CSS Module and
 * are injected automatically by the build plugin.
 */
function buildInstanceCSS(
  id: string,
  containerName: string,
  sorted: [string, number][],
  minWidths: number[],
): string {
  // One @container rule per breakpoint.  Each rule overrides the
  // previous one via the CSS cascade, so `--ba-matches` is always the
  // cumulative list up to that point.
  return sorted
    .map((_, i) => {
      const matchingNames = sorted.slice(0, i + 1).map((e) => e[0]);
      const animName = i % 2 === 0 ? styles.pulseA : styles.pulseB;

      return `
@container ${containerName} (min-width: ${minWidths[i]}px) {
  [data-ba-id="${id}"] {
    --ba-cm-anim: ${animName};
    --ba-matches: '${matchingNames.join(',')}';
  }
}`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// DOM injection
// ---------------------------------------------------------------------------

function injectInstanceStyle(id: string, css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute('data-breakpoints-aware', id);
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

function injectSentry(
  id: string,
  containerName: string,
  target: HTMLElement,
): { sentryContainer: HTMLDivElement; sentry: HTMLDivElement } {
  // Ensure the target can contain absolute-positioned children.
  const pos = getComputedStyle(target).position;
  if (pos === 'static') {
    target.style.position = 'relative';
  }

  const sentryContainer = document.createElement('div');
  sentryContainer.className = styles.sentryContainer;
  // Per-instance container name set directly (can't be shared via CSS Module)
  sentryContainer.style.containerName = containerName;

  const sentry = document.createElement('div');
  sentry.className = styles.sentry;
  // Data attribute used by per-instance @container rules to target this sentry
  sentry.setAttribute('data-ba-id', id);

  sentryContainer.appendChild(sentry);
  target.appendChild(sentryContainer);

  return { sentryContainer, sentry };
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Observe an element's inline size and invoke `onMatch` whenever the
 * set of matching breakpoints changes.
 *
 * Uses dynamically-injected CSS container queries paired with an
 * `IntersectionObserver` on a hidden sentry element.  No polling,
 * no `ResizeObserver` — the browser's own container-query engine
 * drives the detection.
 *
 * @param ele  A CSS selector string or an `HTMLElement` reference.
 * @param opts Breakpoints map and the `onMatch` callback.
 * @returns    A cleanup function that tears down everything.
 *
 * @example
 * ```ts
 * const cleanup = onBreakpointsMatch('.my-card', {
 *   breakpoints: { sm: 480, md: 768, lg: 1024 },
 *   onMatch({ matches }) {
 *     console.log(matches.current); // 'md'
 *     console.log(matches.all);     // ['sm', 'md']
 *   },
 * });
 *
 * // Later, to stop observing:
 * cleanup();
 * ```
 */
export function onBreakpointsMatch<T extends Breakpoints = Breakpoints>(
  ele: string | HTMLElement,
  { id: externalId, breakpoints, onMatch }: OnBreakpointsMatchOptions<T>,
): CleanupFn {
  // --- Resolve target element ------------------------------------------------
  const element: HTMLElement | null =
    typeof ele === 'string'
      ? document.querySelector<HTMLElement>(ele)
      : ele;

  if (!element) {
    throw new Error(
      `[breakpoints-aware] Element not found: ${String(ele)}`,
    );
  }

  // --- Prepare breakpoint data -----------------------------------------------
  const id = externalId ?? uid();
  const containerName = `${id}-cq`;
  const sorted = sortedBreakpoints(breakpoints);
  const minWidths = computeMinWidths(sorted);

  // --- Inject per-instance CSS & DOM -----------------------------------------
  const css = buildInstanceCSS(id, containerName, sorted, minWidths);
  const styleEl = injectInstanceStyle(id, css);
  const { sentryContainer, sentry } = injectSentry(id, containerName, element);

  // --- Track previous matches to avoid duplicate callbacks -------------------
  let prevMatchesKey = '';

  // --- Observe ---------------------------------------------------------------
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;

      const raw = getComputedStyle(entry.target)
        .getPropertyValue('--ba-matches')
        .replace(/'/g, '')
        .trim();

      if (!raw || raw === prevMatchesKey) return;
      prevMatchesKey = raw;

      const all = raw.split(',') as (keyof T)[];
      const current = all[all.length - 1];

      const matches = {} as Record<keyof T, boolean>;
      for (const [name] of sorted) {
        matches[name as keyof T] = all.includes(name as keyof T);
      }

      const result: MatchesResult<T> = { all, current, matches };
      onMatch(result);
    },
    { root: sentryContainer, threshold: 0.1 },
  );

  observer.observe(sentry);

  // --- Cleanup ---------------------------------------------------------------
  return () => {
    observer.disconnect();
    sentryContainer.remove();
    styleEl.remove();
  };
}
