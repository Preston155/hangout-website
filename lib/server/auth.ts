import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import type { EmployeeRole } from '@prisma/client';
import { prisma } from './prisma';

const SESSION_COOKIE = 'ats_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionEmployee = {
  id: string;
  name: string;
  role: EmployeeRole;
};

type SessionPayload = {
  employeeId: string;
  exp: number;
};

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error('SESSION_SECRET must be set to at least 24 characters.');
  }
  return secret;
}

export async function createSessionCookie(employeeId: string) {
  const payload: SessionPayload = {
    employeeId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encoded);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${encoded}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function requireEmployee(): Promise<SessionEmployee> {
  const employee = await getEmployeeFromSession();
  if (!employee) {
    throw new AuthError('Sign in required.');
  }
  return employee;
}

export async function getEmployeeFromSession(): Promise<SessionEmployee | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [encoded, signature] = raw.split('.');
  if (!encoded || !signature || sign(encoded) !== signature) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload.employeeId || payload.exp < Math.floor(Date.now() / 1000)) return null;

  const employee = await prisma.employee.findFirst({
    where: { id: payload.employeeId, active: true },
    select: { id: true, name: true, role: true },
  });

  return employee;
}

export async function getRequestMeta() {
  const headerStore = await headers();
  return {
    userAgent: headerStore.get('user-agent') ?? undefined,
    ipHash: hashIp(headerStore.get('x-forwarded-for') ?? headerStore.get('x-real-ip') ?? ''),
  };
}

export class AuthError extends Error {
  status = 401;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function hashIp(ip: string): string | undefined {
  const firstIp = ip.split(',')[0]?.trim();
  if (!firstIp) return undefined;
  return crypto.createHash('sha256').update(`${firstIp}:${getSessionSecret()}`).digest('hex');
}
