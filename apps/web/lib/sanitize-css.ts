/**
 * Sanitize user-provided CSS by stripping dangerous constructs.
 * Defense-in-depth: the widget renders custom CSS inside a shadow DOM,
 * but we strip known attack vectors regardless.
 */
const MAX_CSS_LENGTH = 10_000; // 10 KB

export function sanitizeCSS(css: string): string {
  // Enforce max length
  if (css.length > MAX_CSS_LENGTH) {
    css = css.slice(0, MAX_CSS_LENGTH) + '\n/* [truncated: exceeded max length] */';
  }

  return (
    css
      // Strip <style> tags (should never appear in CSS value)
      .replace(/<\/?style\b[^>]*>/gi, '/* [removed html tag] */')
      // Remove @import rules (external resource loading)
      .replace(/@import\b[^;]*;?/gi, '/* [removed @import] */')
      // Remove url() references (data exfiltration via background-image etc.)
      .replace(/url\s*\([^)]*\)/gi, '/* [removed url()] */')
      // Remove expression() (IE script execution)
      .replace(/expression\s*\([^)]*\)/gi, '/* [removed expression()] */')
      // Remove behavior: (IE HTC script execution)
      .replace(/behavior\s*:/gi, '/* [removed] */ _x:')
      // Remove -moz-binding (Firefox XBL script execution)
      .replace(/-moz-binding\s*:/gi, '/* [removed] */ _x:')
      // Remove javascript: in any property value (including backslash-encoded variants)
      .replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '/* [removed] */ _x:')
      // Remove backslash-encoded sequences used to bypass filters (e.g. \0075rl, \006A)
      .replace(/\\[0-9a-fA-F]{1,6}\s?/g, '/* [removed escape] */')
      // Remove content property with attr() (data exfiltration)
      .replace(/content\s*:\s*[^;]*attr\s*\([^)]*\)[^;]*/gi, '/* [removed content+attr()] */ content: ""')
  );
}
