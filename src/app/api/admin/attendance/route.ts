import { NextRequest, NextResponse } from 'next/server';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { buildLessons, summarize } from '@/lib/rating';
import { addDays, dateStr } from '@/lib/time';

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const p = req.nextUrl.searchParams;
  const to = p.get('to') || dateStr();
  const from = p.get('from') || addDays(to, -90);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return bad("Sanalar noto'g'ri");
  if (addDays(from, 400) < to) return bad('Oraliq 13 oydan oshmasin');
  const lessons = await buildLessons({ teacherId: p.get('teacherId') || undefined, from, to });
  return NextResponse.json({ lessons, summary: summarize(lessons), from, to });
}
