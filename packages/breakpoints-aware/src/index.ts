export { onBreakpointsMatch, uid } from './onBreakpointsMatch';
export type {
  Breakpoints,
  CleanupFn,
  MatchesResult,
  OnBreakpointsMatchOptions,
} from './types';

/** Sensible default breakpoints (mobile-first). */
export const defaultBreakpoints = {
  xss: 320,
  xs: 480,
  sm: 690,
  md: 850,
  lg: 1124,
  xl: 1380,
  xxl: 1920,
  xxl2: 2160,
} as const;
