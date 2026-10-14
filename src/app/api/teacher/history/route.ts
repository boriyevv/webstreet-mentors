import { NextRequest, NextResponse } from 'next/server';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { buildLessons, summarize } from '@/lib/rating';
import { dateStr, monthOf, monthRange } from '@/lib/time';

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return unauthorized();
  const month = req.nextUrl.searchParams.get('month') || monthOf(dateStr());
  if (!/^\d{4}-\d{2}$/.test(month)) return bad("Oy noto'g'ri");
  const { from, to } = monthRange(month);
  const lessons = await buildLessons({ teacherId: s.uid, from, to });
  return NextResponse.json({ month, lessons, summary: summarize(lessons) });
}
