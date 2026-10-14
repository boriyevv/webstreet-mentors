import { prisma } from './db';

export type AppSettings = {
  centerLat: number;
  centerLng: number;
  radius: number;
  centerName: string;
  address: string;
  graceMin: number;
  earlyWindowMin: number;
  earlyLeaveMin: number;
};
const DEFAULTS: Record<string, string> = {
  centerLat: '38.871090',
  centerLng: '65.800123',
  radius: '300',
  centerName: 'Web Street IT Academy',
  address: 'Qizil Masjid Street, 2/6, Chaqar Mahallah, Karshi, Kashkadarya Region',
  graceMin: '5',
  earlyWindowMin: '30',
  earlyLeaveMin: '10',
};
export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  const m: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) m[r.key] = r.value;
  return {
    centerLat: parseFloat(m.centerLat),
    centerLng: parseFloat(m.centerLng),
    radius: parseFloat(m.radius),
    centerName: m.centerName,
    address: m.address,
    graceMin: parseInt(m.graceMin, 10),
    earlyWindowMin: parseInt(m.earlyWindowMin, 10),
    earlyLeaveMin: parseInt(m.earlyLeaveMin, 10),
  };
}
export async function saveSettings(s: Partial<AppSettings>) {
  for (const [k, v] of Object.entries(s)) {
    if (!(k in DEFAULTS) || v === undefined) continue;
    await prisma.setting.upsert({ where: { key: k }, update: { value: String(v) }, create: { key: k, value: String(v) } });
  }
}
