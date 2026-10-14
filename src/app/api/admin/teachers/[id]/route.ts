import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { dateStr } from '@/lib/time';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const b = await req.json().catch(() => ({}));
  const u = await prisma.user.findUnique({ where: { id: params.id } });
  if (!u || u.role !== 'TEACHER') return bad('Topilmadi', 404);
  const data: any = {};
  if (b.fullName !== undefined) { if (!String(b.fullName).trim()) return bad('Ism familiyani kiriting'); data.fullName = String(b.fullName).trim(); }
  if (b.phone !== undefined) data.phone = String(b.phone).trim();
  if (b.login !== undefined && String(b.login).trim() !== u.login) {
    const l = String(b.login).trim();
    if (l.length < 3) return bad("Login kamida 3 belgidan iborat bo'lsin");
    if (await prisma.user.findUnique({ where: { login: l } })) return bad('Bu login band');
    data.login = l;
  }
  if (b.password) {
    if (String(b.password).length < 6) return bad("Parol kamida 6 belgidan iborat bo'lsin");
    data.passwordHash = await bcrypt.hash(String(b.password), 10);
  }
  if (b.photo && Array.isArray(b.descriptor) && b.descriptor.length === 128) {
    data.photo = String(b.photo);
    data.faceDescriptor = JSON.stringify(b.descriptor);
  }
  if (b.active !== undefined) data.active = !!b.active;
  await prisma.user.update({ where: { id: u.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const u = await prisma.user.findUnique({ where: { id: params.id }, include: { _count: { select: { attendances: true, groups: true } } } });
  if (!u || u.role !== 'TEACHER') return bad('Topilmadi', 404);
  if (u._count.attendances > 0 || u._count.groups > 0) {
    // tarix saqlanadi: faqat faolsizlantiriladi, guruhlari arxivlanadi
    await prisma.user.update({ where: { id: u.id }, data: { active: false } });
    await prisma.group.updateMany({ where: { teacherId: u.id, active: true }, data: { active: false, endDate: dateStr() } });
    return NextResponse.json({ archived: true });
  }
  await prisma.user.delete({ where: { id: u.id } });
  return NextResponse.json({ deleted: true });
}
