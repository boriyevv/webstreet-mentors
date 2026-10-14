import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { teacherSummaries } from '@/lib/rating';
import { dateStr, monthOf, monthRange } from '@/lib/time';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const users = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, phone: true, login: true, photo: true, active: true, faceDescriptor: true, _count: { select: { groups: { where: { active: true } } } } },
  });
  const { from } = monthRange(monthOf(dateStr()));
  const sums = await teacherSummaries(from, dateStr());
  return NextResponse.json({
    teachers: users.map((u) => ({
      id: u.id, fullName: u.fullName, phone: u.phone, login: u.login, photo: u.photo, active: u.active,
      hasFace: !!u.faceDescriptor, groups: u._count.groups, summary: sums[u.id] || null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const b = await req.json().catch(() => ({}));
  const fullName = String(b.fullName || '').trim();
  const phone = String(b.phone || '').trim();
  const login = String(b.login || '').trim();
  const password = String(b.password || '');
  if (!fullName) return bad('Ism familiyani kiriting');
  if (!phone) return bad('Telefon raqamini kiriting');
  if (login.length < 3) return bad("Login kamida 3 belgidan iborat bo'lsin");
  if (password.length < 6) return bad("Parol kamida 6 belgidan iborat bo'lsin");
  if (!b.photo || !Array.isArray(b.descriptor) || b.descriptor.length !== 128) return bad("Rasm yuklang va yuzi aniqlanganiga ishonch hosil qiling");
  if (await prisma.user.findUnique({ where: { login } })) return bad('Bu login band, boshqasini tanlang');
  const u = await prisma.user.create({
    data: { role: 'TEACHER', fullName, phone, login, passwordHash: await bcrypt.hash(password, 10), photo: String(b.photo), faceDescriptor: JSON.stringify(b.descriptor) },
  });
  return NextResponse.json({ id: u.id });
}
