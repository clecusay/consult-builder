/**
 * Lightweight tagged-template engine for HTML generation.
 * - Interpolated values are HTML-escaped by default (XSS-safe).
 * - `SafeHTML` instances pass through unescaped (for trusted sub-templates & icons).
 * - Arrays are auto-joined (for .map() patterns).
 * - `null`, `undefined`, and `false` produce no output (for conditionals).
 */

/** Marks a string as pre-escaped / trusted HTML. */
export class SafeHTML {
  constructor(readonly value: string) {}
  toString(): string { return this.value; }
}

/** Escape HTML special characters. */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Tagged template that auto-escapes interpolated values. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHTML {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v instanceof SafeHTML) {
      out += v.value;
    } else if (Array.isArray(v)) {
      for (const item of v) out += item instanceof SafeHTML ? item.value : esc(String(item ?? ''));
    } else if (v == null || v === false) {
      // skip — enables ${condition && html`...`}
    } else {
      out += esc(String(v));
    }
    out += strings[i + 1];
  }
  return new SafeHTML(out);
}

/** Wrap a trusted string to bypass auto-escaping. */
export function raw(s: string): SafeHTML {
  return new SafeHTML(s);
}
