import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { euclid, haversine } from '@/lib/geo';
import { dateStr, minutesOfDay, toMin, weekday } from '@/lib/time';

const FACE_THRESHOLD = 0.5; // 0.6 — standart; 0.5 — qattiqroq

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') return unauthorized();
  const b = await req.json().catch(() => ({}));
  const type = b.type === 'out' ? 'out' : 'in';
  const lat = Number(b.lat), lng = Number(b.lng), accuracy = Number(b.accuracy || 0);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return bad('Joylashuv aniqlanmadi. GPS ni yoqing.');

  const st = await getSettings();
  const distance = haversine(lat, lng, st.centerLat, st.centerLng);
  if (accuracy > 200) return bad("GPS aniqligi past (" + Math.round(accuracy) + " m). Aniq joylashuvni yoqib, qayta urinib ko'ring.", 400, { code: 'GPS_WEAK' });
  if (distance > st.radius) {
    return bad("Siz o'quv markaz hududida emassiz", 403, { code: 'OUT_OF_RANGE', distance: Math.round(distance), radius: st.radius });
  }

  const user = await prisma.user.findUnique({ where: { id: s.uid } });
  if (!user?.faceDescriptor) return bad("Profilda yuz ma'lumoti yo'q. Administratorga murojaat qiling.");
  if (!Array.isArray(b.descriptor) || b.descriptor.length !== 128) return bad('Yuz aniqlanmadi');
  const faceDist = euclid(JSON.parse(user.faceDescriptor), b.descriptor.map(Number));
  if (faceDist > FACE_THRESHOLD) return bad('Yuz profilingizga mos kelmadi. Yorug\'roq joyda qayta urinib ko\'ring.', 403, { code: 'FACE_MISMATCH' });

  const today = dateStr();
  const now = new Date();
  const nowMin = minutesOfDay(now);
  const g = await prisma.group.findFirst({ where: { id: String(b.groupId || ''), teacherId: s.uid, active: true } });
  if (!g || !g.days.split(',').map(Number).includes(weekday(today)) || g.startDate > today) return bad('Bu guruhda bugun dars yo\'q');
  const start = toMin(g.startTime), end = toMin(g.endTime);
  const snap = typeof b.snap === 'string' && b.snap.length < 150000 ? b.snap : null;
  const existing = await prisma.attendance.findUnique({ where: { groupId_date: { groupId: g.id, date: today } } });

  if (type === 'in') {
    if (existing?.checkInAt) return bad('Siz bu dars uchun allaqachon kelganingizni belgilagansiz');
    if (nowMin < start - st.earlyWindowMin) return bad(`Belgilash dars boshlanishidan ${st.earlyWindowMin} daqiqa oldin ochiladi`);
    if (nowMin > end) return bad('Dars vaqti tugagan');
    const late = Math.max(0, nowMin - start);
    const isLate = late > st.graceMin;
    const a = await prisma.attendance.create({
      data: {
        teacherId: s.uid, groupId: g.id, date: today, checkInAt: now, status: isLate ? 'LATE' : 'ON_TIME', lateMinutes: isLate ? late : 0,
        inLat: lat, inLng: lng, inDistance: Math.round(distance), inFace: Math.round(faceDist * 1000) / 1000, inSnap: snap,
      },
    });
    return NextResponse.json({ ok: true, type, late: isLate, lateMinutes: a.lateMinutes, time: now.toISOString(), distance: Math.round(distance) });
  }

  if (!existing?.checkInAt) return bad('Avval "Keldim" ni belgilang');
  if (existing.checkOutAt) return bad('Chiqish allaqachon belgilangan');
  const early = nowMin < end - st.earlyLeaveMin;
  await prisma.attendance.update({
    where: { id: existing.id },
    data: { checkOutAt: now, earlyLeave: early, outLat: lat, outLng: lng, outDistance: Math.round(distance), outFace: Math.round(faceDist * 1000) / 1000, outSnap: snap },
  });
  return NextResponse.json({ ok: true, type, early, time: now.toISOString(), distance: Math.round(distance) });
}
