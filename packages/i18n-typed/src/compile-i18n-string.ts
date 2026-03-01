// ── Type-level helpers ───────────────────────────────────────────────

// Guard: only allow clean identifiers as param names.
// Rejects matches that captured junk from nested ICU plural braces.
type IsValidParamName<P extends string> = P extends ''
  ? never
  : P extends `${string} ${string}`
  ? never
  : P extends `${string},${string}`
  ? never
  : P extends `${string}{${string}`
  ? never
  : P extends `${string}}${string}`
  ? never
  : P;

// Force TypeScript to eagerly resolve mapped/intersection types in tooltips.
type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Extract simple placeholder names: {name} → "name"
type ExtractSimpleParams<S extends string> = S extends `${string}{${infer P}}${infer Rest}` ? IsValidParamName<P> | ExtractSimpleParams<Rest> : never;

// Extract plural parameter names by splitting on ", plural," first,
// then grabbing the last {identifier before that split point.
// Recursively skips past invalid "{" matches inside plural block innards.
type LastBraceParam<S extends string> = S extends `${string}{${infer P}`
  ? IsValidParamName<P> extends never
    ? LastBraceParam<P>
    : IsValidParamName<P>
  : never;

type ExtractPluralParams<S extends string> = S extends `${infer Before},${string}plural,${infer Rest}`
  ? LastBraceParam<Before> | ExtractPluralParams<Rest>
  : never;

// Combine both into a single params object.
// Simple params accept string | number; plural params require number.
export type InferredParams<S extends string> = Prettify<{ [K in ExtractSimpleParams<S>]: string | number } & { [K in ExtractPluralParams<S>]: number }>;

// ── Runtime ──────────────────────────────────────────────────────────

/**
 * Create a type-safe interpolation function from a template string.
 *
 * Supports two patterns:
 *  • Simple placeholders:  `"Hello, {name}!"`
 *  • ICU-style plurals:    `"{count, plural, zero {No items} one {1 item} other {# items}}"`
 *
 * The returned function's parameter types are inferred from the template.
 */
export const toInferredTypedFn =
  <T extends string>(template: T) =>
  (...[params]: keyof InferredParams<T> extends never ? [params?: InferredParams<T>] : [params: InferredParams<T>]): string => {
    let result = template as string;

    // 1. Resolve plural blocks:
    //    {key, plural, zero {text} one {text} other {text}}
    result = result.replace(
      /\{(\w+),\s*plural,\s*zero\s*\{([^}]*)\}\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\s*\}/g,
      (_, key, zeroText, oneText, otherText) => {
        const count = (params as Record<string, number>)[key];
        // eslint-disable-next-line no-nested-ternary
        const text = count === 0 ? zeroText : count === 1 ? oneText : otherText;
        return text.replace(/#/g, String(count));
      },
    );

    // 2. Resolve simple placeholders: {key}
    result = result.replace(/\{(\w+)\}/g, (_, key) => String((params as Record<string, string | number>)[key]));

    return result;
  };
