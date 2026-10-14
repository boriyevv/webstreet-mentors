import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/auth';
import { teacherSummaries } from '@/lib/rating';
import { dateStr, monthOf, monthRange } from '@/lib/time';

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const month = req.nextUrl.searchParams.get('month') || monthOf(dateStr());
  const { from, to } = monthRange(month);
  const sums = await teacherSummaries(from, to);
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER', active: true }, select: { id: true, fullName: true, photo: true } });
  const rows = teachers
    .map((t) => ({ ...t, summary: sums[t.id] || { total: 0, onTime: 0, late: 0, absent: 0, issues: 0, score: null, level: "Ma'lumot yo'q" } }))
    .sort((a, b) => (b.summary.score ?? -1) - (a.summary.score ?? -1));
  return NextResponse.json({ month, rows });
}
