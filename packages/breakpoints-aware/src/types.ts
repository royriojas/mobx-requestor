/**
 * Breakpoints map where:
 * - key: breakpoint name (e.g. 'xs', 'sm', 'md', 'lg', 'xl')
 * - value: the upper bound width in pixels for that breakpoint range
 *
 * Mobile-first approach: once a breakpoint matches, it stays matched
 * as the container grows. Matches accumulate.
 *
 * Example:
 * ```ts
 * const breakpoints: Breakpoints = {
 *   xss: 320,  // from 0 to 320
 *   xs: 480,   // from 321 to 480
 *   sm: 690,   // from 481 to 690
 *   md: 850,   // from 691 to 850
 *   lg: 1124,  // from 851 to 1124
 *   xl: 1380,  // from 1125 to 1380
 *   xxl: 1920, // from 1381 to 1920
 *   xxl2: 2160 // from 1921 to ∞ (last breakpoint)
 * };
 * ```
 */
export type Breakpoints = { [key: string]: number };

/**
 * Result object passed to the `onMatch` callback whenever the set
 * of matching breakpoints changes.
 */
export type MatchesResult<T extends Breakpoints = Breakpoints> = {
  /** Ordered array of all currently matching breakpoint names (smallest → largest) */
  all: (keyof T)[];
  /** The highest (current) matching breakpoint name */
  current: keyof T;
  /** Record mapping every breakpoint name to whether it currently matches */
  matches: Record<keyof T, boolean>;
};

/**
 * Options for `onBreakpointsMatch`.
 */
export type OnBreakpointsMatchOptions<T extends Breakpoints = Breakpoints> = {
  /** Optional instance id. When omitted one is generated via `uid()`. */
  id?: string;
  breakpoints: T;
  onMatch: (result: MatchesResult<T>) => void;
};

/**
 * Cleanup function returned by `onBreakpointsMatch`.
 * Call it to disconnect the observer, remove injected DOM nodes, and
 * remove injected styles.
 */
export type CleanupFn = () => void;
