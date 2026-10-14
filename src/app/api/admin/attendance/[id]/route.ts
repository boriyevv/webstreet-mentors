import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { bad, getSession, unauthorized } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const a = await prisma.attendance.findUnique({ where: { id: params.id }, include: { teacher: { select: { fullName: true, photo: true } }, group: { select: { name: true, room: true } } } });
  if (!a) return bad('Topilmadi', 404);
  return NextResponse.json({ attendance: a });
}
