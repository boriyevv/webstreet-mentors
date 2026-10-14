'use client';
import { useEffect, useMemo, useState } from 'react';
import { Download, MapPin, ScanFace } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageTitle, Select, Spinner, StatusBadge } from '@/components/ui';
import { addDays, dateStr, fmtDate, fmtTime } from '@/lib/time';

const FILTERS = [
  { v: '', l: 'Hammasi' }, { v: 'ON_TIME', l: 'Vaqtida' }, { v: 'LATE', l: 'Kech' }, { v: 'ABSENT', l: 'Kelmagan' },
];

export default function Attendance() {
  const today = dateStr();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [from, setFrom] = useState(addDays(today, -90));
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => { api('/api/admin/teachers').then((r) => setTeachers(r.teachers)); }, []);
  useEffect(() => {
    setD(null); setErr('');
    const q = new URLSearchParams({ from, to, ...(teacherId ? { teacherId } : {}) });
    api(`/api/admin/attendance?${q}`).then(setD).catch((e) => setErr(e.message));
  }, [teacherId, from, to]);

  const rows = useMemo(() => (d?.lessons || []).filter((l: any) => l.status !== 'UPCOMING' && (!status || l.status === status)), [d, status]);

  async function openDetail(l: any) {
    if (!l.attendanceId) return;
    const r = await api(`/api/admin/attendance/${l.attendanceId}`);
    setDetail(r.attendance);
  }
  function exportCsv() {
    const head = ['Sana', "O'qituvchi", 'Guruh', 'Xona', 'Dars vaqti', 'Keldi', 'Ketdi', 'Holat', 'Kechikish (daq)', 'Masofa (m)'];
    const st: any = { ON_TIME: 'Vaqtida', LATE: 'Kech', ABSENT: 'Kelmagan' };
    const lines = rows.map((l: any) => [fmtDate(l.date), l.teacherName, l.groupName, l.room, `${l.startTime}-${l.endTime}`, fmtTime(l.checkIn), fmtTime(l.checkOut), st[l.status], l.lateMinutes, l.inDistance ?? ''].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['\ufeff' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `davomat_${from}_${to}.csv`; a.click();
  }
  const preset = (days: number) => { setFrom(addDays(today, -days)); setTo(today); };
  const s = d?.summary;

  return (
    <div>
      <PageTitle title="Davomat" sub="Kamida 3 oylik tarixni tekshiring" action={<Button variant="ghost" onClick={exportCsv} disabled={!rows.length}><Download size={16} /> CSV</Button>} />
      <Card className="mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="O'qituvchi">
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Barchasi</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </Select>
        </Field>
        <Field label="Dan"><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Gacha"><Input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} /></Field>
        <div className="flex items-end gap-1.5">
          {[[30, '1 oy'], [90, '3 oy'], [180, '6 oy']].map(([n, l]) => <Button key={n as number} size="sm" variant="soft" onClick={() => preset(n as number)}>{l}</Button>)}
        </div>
      </Card>

      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}
      {!d && !err ? <Spinner /> : d && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4"><p className="text-2xl font-semibold text-brand-600">{s.score === null ? '—' : `${s.score}%`}</p><p className="text-sm text-ink-500">Umumiy ko'rsatkich</p></Card>
            <Card className="p-4"><p className="text-2xl font-semibold text-emerald-600">{s.onTime}</p><p className="text-sm text-ink-500">Vaqtida</p></Card>
            <Card className="p-4"><p className="text-2xl font-semibold text-amber-600">{s.late}</p><p className="text-sm text-ink-500">Kech qolgan</p></Card>
            <Card className="p-4"><p className="text-2xl font-semibold text-red-600">{s.absent}</p><p className="text-sm text-ink-500">Kelmagan</p></Card>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => <button key={f.v} onClick={() => setStatus(f.v)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${status === f.v ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'}`}>{f.l}</button>)}
          </div>
          {rows.length === 0 ? <Card><Empty title="Yozuvlar topilmadi" /></Card> : (
            <Card className="overflow-hidden">
              <div className="hidden grid-cols-[100px_1.4fr_1.2fr_110px_130px_130px] gap-3 border-b border-ink-100 bg-ink-50 px-4 py-2.5 text-xs font-medium text-ink-500 md:grid">
                <span>Sana</span><span>O'qituvchi</span><span>Guruh</span><span>Dars</span><span>Keldi / ketdi</span><span>Holat</span>
              </div>
              <div className="divide-y divide-ink-100">
                {rows.map((l: any) => (
                  <button key={l.key} onClick={() => openDetail(l)} disabled={!l.attendanceId} className="grid w-full gap-1 px-4 py-3 text-left text-sm enabled:hover:bg-brand-50/50 md:grid-cols-[100px_1.4fr_1.2fr_110px_130px_130px] md:items-center md:gap-3">
                    <span className="text-ink-500">{fmtDate(l.date)}</span>
                    <span className="truncate font-medium">{l.teacherName}</span>
                    <span className="truncate text-ink-700">{l.groupName} · {l.room}-xona</span>
                    <span className="text-ink-500">{l.startTime}–{l.endTime}</span>
                    <span>{l.checkIn ? <>{fmtTime(l.checkIn)}{l.checkOut ? ` / ${fmtTime(l.checkOut)}` : ''}{l.earlyLeave && <span className="text-amber-700"> erta</span>}</> : <span className="text-ink-300">—</span>}</span>
                    <span><StatusBadge status={l.status} late={l.lateMinutes} /></span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Davomat tafsilotlari" wide>
        {detail && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold">{detail.teacher.fullName}</p>
              <p className="text-sm text-ink-500">{detail.group.name} · {fmtDate(detail.date)}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ t: 'Keldi', at: detail.checkInAt, snap: detail.inSnap, dist: detail.inDistance, face: detail.inFace, lat: detail.inLat, lng: detail.inLng },
                { t: 'Ketdi', at: detail.checkOutAt, snap: detail.outSnap, dist: detail.outDistance, face: detail.outFace, lat: detail.outLat, lng: detail.outLng }].map((x) => (
                <div key={x.t} className="rounded-2xl border border-ink-200 p-4">
                  <div className="mb-3 flex items-center justify-between"><p className="font-medium">{x.t}</p>{x.at ? <Badge tone="blue">{fmtTime(x.at)}</Badge> : <Badge>Belgilanmagan</Badge>}</div>
                  {x.at && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {x.snap && <img src={x.snap} alt="Yuz tekshiruvi" className="mb-3 w-full rounded-xl" />}
                      <p className="flex items-center gap-2 text-sm text-ink-700"><ScanFace size={15} /> Yuz farqi: {x.face} <span className="text-xs text-ink-500">(0.5 dan past = mos)</span></p>
                      <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-700"><MapPin size={15} /> Markazdan {x.dist} m</p>
                      {x.lat != null && <a className="mt-1.5 inline-block text-xs text-brand-600 underline" target="_blank" rel="noreferrer" href={`https://yandex.com/maps/?pt=${x.lng},${x.lat}&z=18&l=map`}>Xaritada ko'rish</a>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
