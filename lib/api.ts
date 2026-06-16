import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logApiError } from '@/lib/logger';

function parseAllowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const defaults = ['http://localhost:3000'];
  const merged = [...defaults, ...fromEnv, ...(appUrl ? [appUrl] : [])];
  return [...new Set(merged)];
}

const allowedOrigins = parseAllowedOrigins();

export function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function optionsResponse(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export function jsonResponse<T>(request: Request, body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export function errorResponse(
  request: Request,
  error: unknown,
  fallbackStatus = 500,
  route = 'unknown',
): NextResponse<{ error: string }> {
  if (error instanceof ZodError) {
    return jsonResponse(request, { error: error.issues.map((issue) => issue.message).join(', ') }, 400);
  }
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      logApiError(route, error);
    }
    return jsonResponse(request, { error: error.message }, error.status);
  }

  logApiError(route, error, { route });
  const message = process.env.NODE_ENV === 'production' ? 'Unexpected server error' : error instanceof Error ? error.message : 'Unexpected server error';
  return jsonResponse(request, { error: message }, fallbackStatus);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
