import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: s.uid },
    select: { fullName: true, phone: true, login: true, photo: true, groups: { where: { active: true }, orderBy: { startTime: 'asc' } } },
  });
  return NextResponse.json({
    user: user && { fullName: user.fullName, phone: user.phone, login: user.login, photo: user.photo },
    groups: (user?.groups || []).map((g) => ({ id: g.id, name: g.name, room: g.room, days: g.days.split(',').map(Number), startTime: g.startTime, endTime: g.endTime })),
  });
}
