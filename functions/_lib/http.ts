import { DEFAULT_ALLOWED_ORIGINS, type Env } from './env';

export function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/**
 * Returns the origin to echo in Access-Control-Allow-Origin, '' when the request has no Origin
 * (curl, server-to-server), or null when the origin is not allowed.
 */
export function corsOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return '';
  const self = new URL(request.url).origin;
  if (origin === self) return origin;
  if (env.PUBLIC_BASE_URL && origin === new URL(env.PUBLIC_BASE_URL).origin) return origin;
  return allowedOrigins(env).includes(origin) ? origin : null;
}

export function corsHeaders(origin: string | null, methods = 'POST, OPTIONS'): Record<string, string> {
  if (!origin) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function baseUrl(request: Request, env: Env): string {
  return (env.PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/+$/, '');
}

export function list(v: string | undefined): string[] {
  return (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
