import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { todayLessons } from '@/lib/today';
import { buildLessons, summarize } from '@/lib/rating';
import { dateStr, monthOf, monthRange } from '@/lib/time';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return unauthorized();
  const st = await getSettings();
  const today = dateStr();
  const user = await prisma.user.findUnique({ where: { id: s.uid }, select: { fullName: true, photo: true } });
  const { from } = monthRange(monthOf(today));
  const month = summarize(await buildLessons({ teacherId: s.uid, from, to: today }));
  return NextResponse.json({
    user, today, lessons: await todayLessons(s.uid, st), month,
    center: { lat: st.centerLat, lng: st.centerLng, radius: st.radius, name: st.centerName },
  });
}
