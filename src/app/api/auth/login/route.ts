import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { COOKIE, signToken } from '@/lib/token';
import { bad } from '@/lib/auth';

const tries = new Map<string, { n: number; t: number }>();

export async function POST(req: NextRequest) {
  const { login, password } = await req.json().catch(() => ({}));
  if (!login || !password) return bad('Login va parolni kiriting');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
  const k = ip + '|' + String(login).trim();
  const rec = tries.get(k);
  if (rec && Date.now() - rec.t < 15 * 60000 && rec.n >= 8) return bad("Juda ko'p urinish. 15 daqiqadan so'ng qayta urinib ko'ring.", 429);

  const user = await prisma.user.findUnique({ where: { login: String(login).trim() } });
  const ok = user && user.active && (await bcrypt.compare(String(password), user.passwordHash));
  if (!ok) {
    tries.set(k, { n: (rec && Date.now() - rec.t < 15 * 60000 ? rec.n : 0) + 1, t: Date.now() });
    return bad("Login yoki parol noto'g'ri", 401);
  }
  tries.delete(k);
  const token = await signToken({ uid: user.id, role: user.role as any, name: user.fullName });
  const res = NextResponse.json({ role: user.role });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
