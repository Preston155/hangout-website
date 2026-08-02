import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from './auth';

export function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) return fail(error.message, error.status);
  if (error instanceof ZodError) return fail('Invalid request.', 422, error.flatten());
  if (error instanceof Error) return fail(error.message || 'Server error.', 500);
  return fail('Server error.', 500);
}
