import { prisma } from './db';
import { dateStr, fmtTime, minutesOfDay, toMin, weekday } from './time';
import type { AppSettings } from './settings';

export type TodayLesson = {
  groupId: string; name: string; room: string; startTime: string; endTime: string;
  action: 'in' | 'out' | 'done' | 'wait' | 'closed';
  hint: string; status: 'ON_TIME' | 'LATE' | null; lateMinutes: number; checkIn: string; checkOut: string; earlyLeave: boolean;
};

export async function todayLessons(teacherId: string, st: AppSettings): Promise<TodayLesson[]> {
  const today = dateStr();
  const now = minutesOfDay();
  const wd = weekday(today);
  const groups = await prisma.group.findMany({ where: { teacherId, active: true, startDate: { lte: today } }, orderBy: { startTime: 'asc' } });
  const atts = await prisma.attendance.findMany({ where: { teacherId, date: today } });
  const map = new Map(atts.map((a) => [a.groupId, a]));
  const out: TodayLesson[] = [];
  for (const g of groups) {
    if (!g.days.split(',').map(Number).includes(wd)) continue;
    const a = map.get(g.id);
    const start = toMin(g.startTime), end = toMin(g.endTime);
    let action: TodayLesson['action'];
    let hint = '';
    if (a?.checkOutAt) { action = 'done'; hint = 'Dars yakunlandi'; }
    else if (a?.checkInAt) { action = 'out'; hint = 'Dars tugagach "Ketdim" ni bosing'; }
    else if (now < start - st.earlyWindowMin) {
      const t = start - st.earlyWindowMin;
      action = 'wait';
      hint = `Belgilash ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')} da ochiladi`;
    } else if (now > end) { action = 'closed'; hint = 'Vaqt tugagan: dars "kelmagan" deb hisoblanadi'; }
    else action = 'in';
    out.push({
      groupId: g.id, name: g.name, room: g.room, startTime: g.startTime, endTime: g.endTime, action, hint,
      status: a ? (a.status === 'LATE' ? 'LATE' : 'ON_TIME') : null,
      lateMinutes: a?.lateMinutes || 0, checkIn: fmtTime(a?.checkInAt), checkOut: fmtTime(a?.checkOutAt), earlyLeave: !!a?.earlyLeave,
    });
  }
  return out;
}
