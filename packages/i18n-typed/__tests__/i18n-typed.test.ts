import { describe, test, expect } from 'bun:test';
import { toInferredTypedFn } from '../src/compile-i18n-string';

describe('i18n-typed', () => {
  describe('simple placeholders', () => {
    test('should interpolate a single placeholder', () => {
      const fn = toInferredTypedFn('Hello, {name}!');
      expect(fn({ name: 'Alice' })).toBe('Hello, Alice!');
    });

    test('should interpolate multiple placeholders', () => {
      const fn = toInferredTypedFn('{sender} sent {amount} to {recipient}');
      expect(fn({ sender: 'Alice', amount: '$50', recipient: 'Bob' })).toBe('Alice sent $50 to Bob');
    });

    test('should interpolate numeric values', () => {
      const fn = toInferredTypedFn('Item #{id}: {name}');
      expect(fn({ id: 42, name: 'Widget' })).toBe('Item #42: Widget');
    });

    test('should handle a template with no placeholders', () => {
      const fn = toInferredTypedFn('No placeholders here');
      expect(fn()).toBe('No placeholders here');
    });

    test('should handle the same placeholder used multiple times', () => {
      const fn = toInferredTypedFn('{name} and {name} again');
      expect(fn({ name: 'Echo' })).toBe('Echo and Echo again');
    });
  });

  describe('plural blocks', () => {
    test('should resolve zero case', () => {
      const fn = toInferredTypedFn('{count, plural, zero {No items} one {1 item} other {# items}}');
      expect(fn({ count: 0 })).toBe('No items');
    });

    test('should resolve one case', () => {
      const fn = toInferredTypedFn('{count, plural, zero {No items} one {1 item} other {# items}}');
      expect(fn({ count: 1 })).toBe('1 item');
    });

    test('should resolve other case and replace # with count', () => {
      const fn = toInferredTypedFn('{count, plural, zero {No items} one {1 item} other {# items}}');
      expect(fn({ count: 42 })).toBe('42 items');
    });

    test('should handle large numbers in other case', () => {
      const fn = toInferredTypedFn('{count, plural, zero {No results} one {1 result} other {# results}}');
      expect(fn({ count: 1000000 })).toBe('1000000 results');
    });
  });

  describe('combined placeholders and plurals', () => {
    test('should handle simple placeholder followed by plural block', () => {
      const fn = toInferredTypedFn('{user} has {count, plural, zero {no followers} one {1 follower} other {# followers}}');
      expect(fn({ user: 'Alice', count: 0 })).toBe('Alice has no followers');
      expect(fn({ user: 'Bob', count: 1 })).toBe('Bob has 1 follower');
      expect(fn({ user: 'Charlie', count: 1280 })).toBe('Charlie has 1280 followers');
    });

    test('should handle plural block in the middle of text with simple placeholders', () => {
      const template = 'Hello {name}, you have {count, plural, zero {no messages} one {1 message} other {# messages}} waiting';
      const fn = toInferredTypedFn(template);
      expect((fn as any)({ name: 'Alice', count: 0 })).toBe('Hello Alice, you have no messages waiting');
      expect((fn as any)({ name: 'Bob', count: 5 })).toBe('Hello Bob, you have 5 messages waiting');
    });
  });

  describe('edge cases', () => {
    test('should handle placeholder at the very start', () => {
      const fn = toInferredTypedFn('{greeting} world');
      expect(fn({ greeting: 'Hello' })).toBe('Hello world');
    });

    test('should handle placeholder at the very end', () => {
      const fn = toInferredTypedFn('Hello {target}');
      expect(fn({ target: 'world' })).toBe('Hello world');
    });

    test('should handle adjacent placeholders', () => {
      const fn = toInferredTypedFn('{first}{second}');
      expect(fn({ first: 'Hello', second: 'World' })).toBe('HelloWorld');
    });

    test('should handle empty string values', () => {
      const fn = toInferredTypedFn('before{mid}after');
      expect(fn({ mid: '' })).toBe('beforeafter');
    });
  });
});
