import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { validateGroup } from '@/lib/groups';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const groups = await prisma.group.findMany({ orderBy: [{ active: 'desc' }, { startTime: 'asc' }], include: { teacher: { select: { fullName: true } } } });
  return NextResponse.json({
    groups: groups.map((g) => ({ id: g.id, name: g.name, room: g.room, days: g.days.split(',').map(Number), startTime: g.startTime, endTime: g.endTime, startDate: g.startDate, endDate: g.endDate, active: g.active, teacherId: g.teacherId, teacherName: g.teacher.fullName })),
  });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const v = await validateGroup(await req.json().catch(() => ({})));
  if (v.error) return bad(v.error);
  const g = await prisma.group.create({ data: v.data! });
  return NextResponse.json({ id: g.id });
}
