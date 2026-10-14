import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { bad, getSession, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return unauthorized();
  const { current, next } = await req.json().catch(() => ({}));
  if (!next || String(next).length < 6) return bad("Yangi parol kamida 6 belgidan iborat bo'lsin");
  const u = await prisma.user.findUnique({ where: { id: s.uid } });
  if (!u || !(await bcrypt.compare(String(current || ''), u.passwordHash))) return bad("Joriy parol noto'g'ri");
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(String(next), 10) } });
  return NextResponse.json({ ok: true });
}
