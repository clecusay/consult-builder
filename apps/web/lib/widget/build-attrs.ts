import type { WidgetMode, WidgetLayout, RegionStyle } from '@treatment-builder/shared';

const VALID_FLOWS = new Set<string>(['regions_services', 'regions_concerns', 'treatment_builder']);
const VALID_LAYOUTS = new Set<string>(['split', 'guided']);
const VALID_REGION_STYLES = new Set<string>(['diagram', 'cards']);
const SAFE_RE = /^[a-zA-Z0-9_-]+$/;

function sanitize(value: string | undefined, allowed: Set<string>): string | undefined {
  if (!value) return undefined;
  if (allowed.has(value)) return value;
  return undefined;
}

function sanitizeId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (SAFE_RE.test(value)) return value;
  return undefined;
}

interface BuildAttrsOptions {
  tenantId: string;
  fullpage?: boolean;
  flow?: string;
  layout?: string;
  regionStyle?: string;
  location?: string;
}

/**
 * Build sanitized data-* attributes for the <treatment-builder> custom element.
 * All user-supplied values are validated against whitelists.
 */
export function buildWidgetAttrs(opts: BuildAttrsOptions): string {
  return [
    `data-tenant-id="${opts.tenantId}"`,
    opts.fullpage ? 'data-fullpage' : '',
    sanitize(opts.flow, VALID_FLOWS) ? `data-flow="${sanitize(opts.flow, VALID_FLOWS)}"` : '',
    sanitize(opts.layout, VALID_LAYOUTS) ? `data-layout="${sanitize(opts.layout, VALID_LAYOUTS)}"` : '',
    sanitize(opts.regionStyle, VALID_REGION_STYLES) ? `data-region-style="${sanitize(opts.regionStyle, VALID_REGION_STYLES)}"` : '',
    sanitizeId(opts.location) ? `data-location="${sanitizeId(opts.location)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
