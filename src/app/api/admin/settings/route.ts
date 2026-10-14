import { NextRequest, NextResponse } from 'next/server';
import { bad, getSession, unauthorized } from '@/lib/auth';
import { getSettings, saveSettings } from '@/lib/settings';

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') return unauthorized();
  const b = await req.json().catch(() => ({}));
  const lat = Number(b.centerLat), lng = Number(b.centerLng), radius = Number(b.radius);
  if (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180)) return bad("Koordinatalar noto'g'ri");
  if (!(radius >= 20 && radius <= 5000)) return bad("Radius 20 dan 5000 metrgacha bo'lsin");
  const g = Number(b.graceMin), e = Number(b.earlyWindowMin), l = Number(b.earlyLeaveMin);
  if ([g, e, l].some((x) => !(x >= 0 && x <= 240))) return bad("Daqiqalar 0 dan 240 gacha bo'lsin");
  await saveSettings({ centerLat: lat, centerLng: lng, radius, centerName: String(b.centerName || '').trim(), address: String(b.address || '').trim(), graceMin: g, earlyWindowMin: e, earlyLeaveMin: l });
  return NextResponse.json({ ok: true });
}
