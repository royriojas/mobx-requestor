import { Window } from 'happy-dom';

// 1. Mock CSS Modules so they don't crash or return empty objects in Bun
Object.defineProperties(String.prototype, {
  sentryContainer: { value: 'sentry-container' },
  sentry: { value: 'sentry-element' },
  pulseA: { value: 'pulse-a' },
  pulseB: { value: 'pulse-b' },
});

// 2. Set up Happy DOM
const window = new Window();
window.SyntaxError = globalThis.SyntaxError;
window.TypeError = globalThis.TypeError;
window.Error = globalThis.Error;

Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  HTMLDivElement: window.HTMLDivElement,
  HTMLStyleElement: window.HTMLStyleElement,
  getComputedStyle: window.getComputedStyle.bind(window),
});

// 3. Mock IntersectionObserver
interface MockObserver {
  callback: (entries: any[]) => void;
  options: any;
  observedElement: HTMLElement | null;
}

export let activeObservers: MockObserver[] = [];

globalThis.IntersectionObserver = class {
  constructor(callback: any, options: any) {
    activeObservers.push({
      callback,
      options,
      observedElement: null,
    });
  }

  observe(target: any) {
    const latest = activeObservers[activeObservers.length - 1];
    if (latest) {
      latest.observedElement = target;
    }
  }

  disconnect() {
    activeObservers = [];
  }
} as any;

// @ts-expect-error we need to mock in this env
window.IntersectionObserver = globalThis.IntersectionObserver;

// Helper to simulate a breakpoint trigger on the sentry element
export const triggerBreakpoint = (sentry: HTMLElement, matches: string) => {
  sentry.style.setProperty('--ba-cm-matches', `'${matches}'`);

  const obs = activeObservers.find(o => o.observedElement === sentry);
  if (!obs) {
    throw new Error('No observer found for sentry');
  }

  obs.callback([
    {
      isIntersecting: true,
      target: sentry,
    },
  ]);
};

export const clearActiveObservers = () => {
  activeObservers = [];
};
