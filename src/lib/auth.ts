import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE, Session, verifyToken } from './token';
import { prisma } from './db';

export async function getSession(): Promise<Session | null> {
  const t = cookies().get(COOKIE)?.value;
  const s = await verifyToken(t);
  if (!s) return null;
  // foydalanuvchi o'chirilgan yoki bloklangan bo'lsa sessiya yaroqsiz
  const u = await prisma.user.findUnique({ where: { id: s.uid }, select: { active: true, role: true } });
  if (!u || !u.active) return null;
  return { ...s, role: u.role as Session['role'] };
}
export const unauthorized = () => NextResponse.json({ error: "Ruxsat yo'q. Qaytadan kiring." }, { status: 401 });
export const bad = (error: string, status = 400, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });
