/**
 * Sanitize user-provided CSS by stripping dangerous constructs.
 * Defense-in-depth: the widget renders custom CSS inside a shadow DOM,
 * but we strip known attack vectors regardless.
 */
export function sanitizeCSS(css: string): string {
  return (
    css
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
      // Remove javascript: in any property value
      .replace(/javascript\s*:/gi, '/* [removed] */ _x:')
  );
}
