import { prisma } from './db';
import { findConflict } from './rating';
import { dateStr, toMin } from './time';

export async function validateGroup(b: any, id?: string): Promise<{ error?: string; data?: any }> {
  const name = String(b.name || '').trim();
  const room = String(b.room || '').trim();
  const days = Array.isArray(b.days) ? Array.from(new Set(b.days.map(Number))).filter((d: number) => d >= 1 && d <= 7).sort().join(',') : '';
  const re = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!name) return { error: 'Guruh nomini kiriting' };
  if (!b.teacherId || !(await prisma.user.findFirst({ where: { id: String(b.teacherId), role: 'TEACHER', active: true } }))) return { error: "O'qituvchini tanlang" };
  if (!room) return { error: 'Xonani kiriting' };
  if (!days) return { error: 'Dars kunlarini tanlang' };
  if (!re.test(b.startTime || '') || !re.test(b.endTime || '')) return { error: "Dars vaqtini to'g'ri kiriting" };
  if (toMin(b.startTime) >= toMin(b.endTime)) return { error: "Tugash vaqti boshlanishdan keyin bo'lsin" };
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(b.startDate || '') ? b.startDate : dateStr();
  const conflict = await findConflict({ id, teacherId: String(b.teacherId), room, days, startTime: b.startTime, endTime: b.endTime });
  if (conflict) return { error: conflict };
  return { data: { name, room, days, startTime: b.startTime, endTime: b.endTime, startDate, teacherId: String(b.teacherId) } };
}
