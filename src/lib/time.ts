// Toshkent vaqti (UTC+5, yozgi/qishki vaqt yo'q)
export const TZ_OFFSET_MIN = 300;
export const DAY_NAMES = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
export const DAY_SHORT = ['', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak'];

function local(d: Date) {
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60000);
}
export function dateStr(d: Date = new Date()) {
  return local(d).toISOString().slice(0, 10);
}
export function minutesOfDay(d: Date = new Date()) {
  const l = local(d);
  return l.getUTCHours() * 60 + l.getUTCMinutes();
}
export function toMin(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
export function weekday(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}
export function addDays(date: string, n: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
export function eachDate(from: string, to: string) {
  const out: string[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard++ < 800) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}
export function fmtTime(iso?: string | Date | null) {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return local(d).toISOString().slice(11, 16);
}
export function fmtDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y}`;
}
export function monthOf(date: string) {
  return date.slice(0, 7);
}
export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  return { from, to };
}
export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
export const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
export function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
