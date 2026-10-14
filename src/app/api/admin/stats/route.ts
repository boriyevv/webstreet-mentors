import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/auth';
import { buildLessons } from '@/lib/rating';
import { dateStr } from '@/lib/time';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const today = dateStr();
  const [teachers, groups, lessons] = await Promise.all([
    prisma.user.count({ where: { role: 'TEACHER', active: true } }),
    prisma.group.count({ where: { active: true } }),
    buildLessons({ from: today, to: today }),
  ]);
  return NextResponse.json({
    today, teachers, groups, lessons,
    counts: {
      total: lessons.length,
      onTime: lessons.filter((l) => l.status === 'ON_TIME').length,
      late: lessons.filter((l) => l.status === 'LATE').length,
      absent: lessons.filter((l) => l.status === 'ABSENT').length,
      upcoming: lessons.filter((l) => l.status === 'UPCOMING').length,
    },
  });
}
