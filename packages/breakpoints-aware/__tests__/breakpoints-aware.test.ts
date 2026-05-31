import { describe, test, expect, afterEach, jest } from 'bun:test';
import { triggerBreakpoint, clearActiveObservers } from './setup';
import { onBreakpointsMatch } from '../src/onBreakpointsMatch';
import { defaultBreakpoints, type MatchesResult } from '../src/index';

describe('breakpoints-aware', () => {
  afterEach(() => {
    // Clear DOM and observers
    document.body.innerHTML = '';
    const styleTags = document.head.querySelectorAll('[data-breakpoints-aware]');
    styleTags.forEach(tag => tag.remove());
    clearActiveObservers();
  });

  test('should successfully initialize and inject DOM/CSS', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    const cleanup = onBreakpointsMatch('#test-container', {
      breakpoints: defaultBreakpoints,
      onMatch: () => { },
    });

    // Verify sentry is injected
    const sentryContainer = container.querySelector('.sentry-container');
    expect(sentryContainer).not.toBeNull();
    const sentry = sentryContainer?.querySelector('.sentry-element');
    expect(sentry).not.toBeNull();

    // Verify style tag is injected
    const styleEl = document.head.querySelector('style[data-breakpoints-aware]');
    expect(styleEl).not.toBeNull();

    cleanup();

    // Verify elements are removed after cleanup
    expect(container.querySelector('.sentry-container')).toBeNull();
    expect(document.head.querySelector('style[data-breakpoints-aware]')).toBeNull();
  });

  test('should resolve target when HTMLElement is provided directly', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const cleanup = onBreakpointsMatch(container, {
      breakpoints: defaultBreakpoints,
      onMatch: () => { },
    });

    const sentryContainer = container.querySelector('.sentry-container');
    expect(sentryContainer).not.toBeNull();

    cleanup();
  });

  test('should call onMatch with the correct matches result when a breakpoint is matched', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onMatch = jest.fn();
    const cleanup = onBreakpointsMatch(container, {
      breakpoints: { sm: 480, md: 768, lg: 1024 },
      onMatch,
    });

    const sentry = container.querySelector('.sentry-element') as HTMLElement;
    expect(sentry).not.toBeNull();

    // Simulate sm and md matching
    triggerBreakpoint(sentry, 'sm,md');

    expect(onMatch).toHaveBeenCalledTimes(1);
    const result = onMatch.mock.calls[0]![0];
    expect(result.all).toEqual(['sm', 'md']);
    expect(result.current).toBe('md');
    expect(result.matches).toEqual({
      sm: true,
      md: true,
      lg: false,
    });

    cleanup();
  });

  test('should avoid duplicate onMatch callbacks for the same matches', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onMatch = jest.fn();
    const cleanup = onBreakpointsMatch(container, {
      breakpoints: { sm: 480, md: 768 },
      onMatch,
    });

    const sentry = container.querySelector('.sentry-element') as HTMLElement;

    // Trigger first match
    triggerBreakpoint(sentry, 'sm');
    // Trigger second match (identical)
    triggerBreakpoint(sentry, 'sm');

    expect(onMatch).toHaveBeenCalledTimes(1);

    // Trigger new match
    triggerBreakpoint(sentry, 'sm,md');
    expect(onMatch).toHaveBeenCalledTimes(2);

    cleanup();
  });

  test('should throw an error if selector resolves to nothing', () => {
    expect(() => {
      onBreakpointsMatch('#non-existent-selector', {
        breakpoints: defaultBreakpoints,
        onMatch: () => { },
      });
    }).toThrow('[breakpoints-aware] Element not found: #non-existent-selector');
  });

  test('should support custom instance id', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const customId = 'my-custom-breakpoint-id';
    const cleanup = onBreakpointsMatch(container, {
      id: customId,
      breakpoints: { sm: 480 },
      onMatch: () => { },
    });

    const sentry = container.querySelector('.sentry-element');
    expect(sentry?.getAttribute('data-ba-id')).toBe(customId);

    const styleEl = document.head.querySelector(`style[data-breakpoints-aware="${customId}"]`);
    expect(styleEl).not.toBeNull();

    cleanup();
  });

  test('should compile with strictly typed generic breakpoint keys', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const myBreakpoints = {
      mobile: 480,
      tablet: 768,
      desktop: 1024,
    } as const;

    const cleanup = onBreakpointsMatch(container, {
      breakpoints: myBreakpoints,
      onMatch(result) {
        // Verify MatchesResult generic typing works correctly
        const resultTyped: MatchesResult<typeof myBreakpoints> = result;

        expect(resultTyped.all).toBeDefined();
        expect(resultTyped.current).toBeDefined();
        expect(resultTyped.matches).toBeDefined();
      },
    });

    cleanup();
  });
});

