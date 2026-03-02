// ── Type-level helpers ───────────────────────────────────────────────

// Guard: only allow clean identifiers as param names.
// Rejects matches that captured junk from nested ICU plural braces.
export type IsValidParamName<P extends string> = P extends ''
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
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Extract simple placeholder names: {name} → "name"
export type ExtractSimpleParams<S extends string> = S extends `${string}{${infer P}}${infer Rest}` ? IsValidParamName<P> | ExtractSimpleParams<Rest> : never;

// Extract plural parameter names by splitting on ", plural," first,
// then grabbing the last `{identifier` before that split point.
// Uses a greedy left match to find the rightmost `{` in Before.
export type LastBraceParam<S extends string> = S extends `${string}{${infer P}`
  ? P extends `${string}{${infer Inner}`
    ? LastBraceParam<`{${Inner}`>
    : IsValidParamName<P>
  : never;

export type ExtractPluralParams<S extends string> = S extends `${infer Before}, plural,${infer Rest}`
  ? LastBraceParam<Before> | ExtractPluralParams<Rest>
  : never;

// Combine both into a single params object.
// Simple params accept string | number; plural params require number.
export type InferredParams<S extends string> = Prettify<{ [K in ExtractSimpleParams<S>]: string | number } & { [K in ExtractPluralParams<S>]: number }>;

// Validate that every plural block contains an `other` case.
// Produces `false` if any plural block is missing `other {…}`.
export type HasValidPlurals<S extends string> = S extends `${string}, plural,${infer Rest}`
  ? Rest extends `${string}other {${string}}${infer AfterPlural}`
    ? HasValidPlurals<AfterPlural>
    : false
  : true;

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
  <T extends string>(template: HasValidPlurals<T> extends true ? T : never) =>
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

    // 2. Handle incomplete plural blocks (missing zero/one/other cases)
    result = result.replace(/\{(\w+),\s*plural,((?:[^{}]|\{[^}]*\})*)\}/g, (match, key, body) => {
      const count = (params as Record<string, number>)[key];
      if (count === 0) {
        const zeroMatch = body.match(/zero\s*\{([^}]*)\}/);
        if (zeroMatch) return zeroMatch[1].replace(/#/g, String(count));
      }
      if (count === 1) {
        const oneMatch = body.match(/one\s*\{([^}]*)\}/);

        if (oneMatch) return oneMatch[1].replace(/#/g, String(count));
      }
      const otherMatch = body.match(/other\s*\{([^}]*)\}/);
      if (otherMatch) return otherMatch[1].replace(/#/g, String(count));

      return String(count);
    });

    // 3. Resolve simple placeholders: {key}
    result = result.replace(/\{(\w+)\}/g, (_, key) => String((params as Record<string, string | number>)[key]));

    return result;
  };
