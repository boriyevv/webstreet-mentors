import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'wsm_session';
export type Session = { uid: string; role: 'ADMIN' | 'TEACHER'; name: string };

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET o\'rnatilmagan');
  return new TextEncoder().encode(s || 'dev-secret-change-me-please-32chars');
}
export async function signToken(s: Session) {
  return new SignJWT({ ...s }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secret());
}
export async function verifyToken(token?: string | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: payload.uid as string, role: payload.role as Session['role'], name: payload.name as string };
  } catch {
    return null;
  }
}
