import { NextResponse } from 'next/server';

/**
 * CORS origin validation for widget endpoints.
 * If a tenant has configured `allowed_origins`, only those origins get CORS access.
 * If empty/null, all origins are allowed (backwards compatible).
 */
export function getCorsOrigin(
  request: Request,
  allowedOrigins?: string[] | null,
): string {
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return '*';
  }

  const origin = request.headers.get('Origin');
  if (!origin) return '';

  // Exact match against the allow-list
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  return '';
}

/** Build standard CORS headers for widget responses. */
export function corsHeaders(origin: string): Record<string, string> {
  if (!origin) return {};
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
  };
  if (origin !== '*') {
    headers['Vary'] = 'Origin';
  }
  return headers;
}

/** Shared CORS preflight handler for widget API routes. */
export function handleCorsOptions(request: Request, allowedMethods: string): NextResponse {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
      'Access-Control-Allow-Methods': allowedMethods,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  });
}
