import { prisma } from './db';
import { dateStr, eachDate, minutesOfDay, toMin, weekday } from './time';

export type LessonStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'UPCOMING';
export interface Lesson {
  key: string;
  attendanceId?: string;
  date: string;
  groupId: string;
  groupName: string;
  room: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacherName: string;
  status: LessonStatus;
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number;
  earlyLeave: boolean;
  noCheckout: boolean;
  inDistance: number | null;
  inFace: number | null;
}

export async function buildLessons(opts: { teacherId?: string; from: string; to: string }): Promise<Lesson[]> {
  const today = dateStr();
  const nowMin = minutesOfDay();
  const groups = await prisma.group.findMany({
    where: opts.teacherId ? { teacherId: opts.teacherId } : {},
    include: { teacher: { select: { fullName: true } } },
  });
  const atts = await prisma.attendance.findMany({
    where: { date: { gte: opts.from, lte: opts.to }, ...(opts.teacherId ? { teacherId: opts.teacherId } : {}) },
    select: {
      id: true, teacherId: true, groupId: true, date: true, checkInAt: true, checkOutAt: true, status: true,
      lateMinutes: true, earlyLeave: true, inDistance: true, inFace: true,
      teacher: { select: { fullName: true } },
      group: { select: { name: true, room: true, startTime: true, endTime: true } },
    },
  });
  const map = new Map(atts.map((a) => [a.groupId + '|' + a.date, a]));
  const used = new Set<string>();
  const out: Lesson[] = [];

  const fromAtt = (a: (typeof atts)[number]): Lesson => {
    const endMin = toMin(a.group.endTime);
    const past = a.date < today || (a.date === today && nowMin > endMin + 30);
    return {
      key: a.groupId + '|' + a.date,
      attendanceId: a.id,
      date: a.date,
      groupId: a.groupId,
      groupName: a.group.name,
      room: a.group.room,
      startTime: a.group.startTime,
      endTime: a.group.endTime,
      teacherId: a.teacherId,
      teacherName: a.teacher.fullName,
      status: a.status === 'LATE' ? 'LATE' : 'ON_TIME',
      checkIn: a.checkInAt ? a.checkInAt.toISOString() : null,
      checkOut: a.checkOutAt ? a.checkOutAt.toISOString() : null,
      lateMinutes: a.lateMinutes,
      earlyLeave: a.earlyLeave,
      noCheckout: !a.checkOutAt && past,
      inDistance: a.inDistance,
      inFace: a.inFace,
    };
  };

  for (const g of groups) {
    const days = g.days.split(',').map(Number);
    const start = g.startDate > opts.from ? g.startDate : opts.from;
    let end = opts.to > today ? today : opts.to;
    if (g.endDate && g.endDate < end) end = g.endDate;
    if (start > end) continue;
    for (const d of eachDate(start, end)) {
      if (!days.includes(weekday(d))) continue;
      const key = g.id + '|' + d;
      const a = map.get(key);
      if (a) {
        used.add(key);
        out.push(fromAtt(a));
        continue;
      }
      const upcoming = d === today && nowMin < toMin(g.endTime);
      out.push({
        key, date: d, groupId: g.id, groupName: g.name, room: g.room, startTime: g.startTime, endTime: g.endTime,
        teacherId: g.teacherId, teacherName: g.teacher.fullName,
        status: upcoming ? 'UPCOMING' : 'ABSENT',
        checkIn: null, checkOut: null, lateMinutes: 0, earlyLeave: false, noCheckout: false, inDistance: null, inFace: null,
      });
    }
  }
  // jadval o'zgargan bo'lsa ham tarix yo'qolmasligi uchun
  for (const a of atts) if (!used.has(a.groupId + '|' + a.date)) out.push(fromAtt(a));

  out.sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : b.date.localeCompare(a.date)));
  return out;
}

export interface Summary {
  total: number;
  onTime: number;
  late: number;
  absent: number;
  issues: number;
  score: number | null;
  level: string;
}

export function levelOf(score: number | null) {
  if (score === null) return "Ma'lumot yo'q";
  if (score >= 95) return "A'lo";
  if (score >= 85) return 'Yaxshi';
  if (score >= 70) return 'Qoniqarli';
  return 'Past';
}

// Ball: vaqtida = 1, kech (<=15 daq) = 0.7, kech (>15 daq) = 0.4, kelmagan = 0.
// Erta ketish yoki "ketdim" belgilanmagan bo'lsa -0.1.
export function summarize(lessons: Lesson[]): Summary {
  let pts = 0, onTime = 0, late = 0, absent = 0, issues = 0, total = 0;
  for (const l of lessons) {
    if (l.status === 'UPCOMING') continue;
    total++;
    if (l.status === 'ABSENT') { absent++; continue; }
    let p = 1;
    if (l.status === 'LATE') { late++; p = l.lateMinutes <= 15 ? 0.7 : 0.4; } else onTime++;
    if (l.earlyLeave || l.noCheckout) { issues++; p -= 0.1; }
    pts += Math.max(0, p);
  }
  const score = total ? Math.round((pts / total) * 1000) / 10 : null;
  return { total, onTime, late, absent, issues, score, level: levelOf(score) };
}

export async function teacherSummaries(from: string, to: string) {
  const lessons = await buildLessons({ from, to });
  const by: Record<string, Lesson[]> = {};
  for (const l of lessons) (by[l.teacherId] ||= []).push(l);
  const res: Record<string, Summary> = {};
  for (const [id, ls] of Object.entries(by)) res[id] = summarize(ls);
  return res;
}

export async function findConflict(g: { id?: string; teacherId: string; room: string; days: string; startTime: string; endTime: string }) {
  const others = await prisma.group.findMany({ where: { active: true, ...(g.id ? { id: { not: g.id } } : {}) } });
  const days = g.days.split(',');
  for (const o of others) {
    if (!o.days.split(',').some((d) => days.includes(d))) continue;
    const overlap = toMin(g.startTime) < toMin(o.endTime) && toMin(o.startTime) < toMin(g.endTime);
    if (!overlap) continue;
    if (o.teacherId === g.teacherId) return `Bu o'qituvchida shu vaqtda boshqa guruh bor: ${o.name} (${o.startTime}-${o.endTime})`;
    if (o.room.trim().toLowerCase() === g.room.trim().toLowerCase()) return `${o.room}-xona shu vaqtda band: ${o.name} (${o.startTime}-${o.endTime})`;
  }
  return null;
}
