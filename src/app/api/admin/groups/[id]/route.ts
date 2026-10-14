import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { dateStr } from '@/lib/time';
import { validateGroup } from '@/lib/groups';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const b = await req.json().catch(() => ({}));
  const g = await prisma.group.findUnique({ where: { id: params.id } });
  if (!g) return bad('Topilmadi', 404);
  if (b.restore) {
    await prisma.group.update({ where: { id: g.id }, data: { active: true, endDate: null } });
    return NextResponse.json({ ok: true });
  }
  const v = await validateGroup(b, g.id);
  if (v.error) return bad(v.error);
  await prisma.group.update({ where: { id: g.id }, data: v.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const g = await prisma.group.findUnique({ where: { id: params.id }, include: { _count: { select: { attendances: true } } } });
  if (!g) return bad('Topilmadi', 404);
  if (g._count.attendances > 0) {
    await prisma.group.update({ where: { id: g.id }, data: { active: false, endDate: dateStr() } });
    return NextResponse.json({ archived: true });
  }
  await prisma.group.delete({ where: { id: g.id } });
  return NextResponse.json({ deleted: true });
}
