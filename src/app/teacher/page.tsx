'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Clock, DoorOpen, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar, Badge, Card, Empty, ScoreBar, Spinner, StatusBadge, levelTone, cn } from '@/components/ui';
import { DAY_NAMES, fmtDate, weekday } from '@/lib/time';

export default function TeacherHome() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api('/api/teacher/today').then(setD).catch((e) => setErr(e.message)), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!d) return <Spinner />;
  const m = d.month;
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Avatar src={d.user?.photo} name={d.user?.fullName || ''} size={52} />
        <div>
          <p className="text-sm text-ink-500">Xush kelibsiz</p>
          <h1 className="text-xl font-semibold tracking-tight">{d.user?.fullName}</h1>
        </div>
      </div>

      <Card className="mb-8 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-ink-500">Shu oydagi reytingim</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-brand-600">{m.score === null ? '—' : m.score}<span className="text-lg text-ink-300">{m.score === null ? '' : '%'}</span></p>
          </div>
          <Badge tone={levelTone(m.level)}>{m.level}</Badge>
        </div>
        <div className="mt-4"><ScoreBar score={m.score} /></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div><p className="font-semibold text-emerald-700">{m.onTime}</p><p className="text-xs text-ink-500">Vaqtida</p></div>
          <div><p className="font-semibold text-amber-700">{m.late}</p><p className="text-xs text-ink-500">Kech</p></div>
          <div><p className="font-semibold text-red-700">{m.absent}</p><p className="text-xs text-ink-500">Qoldirgan</p></div>
        </div>
      </Card>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Bugungi darslar</h2>
        <span className="text-sm text-ink-500">{DAY_NAMES[weekday(d.today)]}, {fmtDate(d.today)}</span>
      </div>
      {d.lessons.length === 0 ? (
        <Card><Empty title="Bugun darsingiz yo'q" text="Dam oling yoki ish jadvalini profilingizdan ko'ring." /></Card>
      ) : (
        <div className="space-y-3">
          {d.lessons.map((l: any) => (
            <Card key={l.groupId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{l.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                    <span className="inline-flex items-center gap-1"><Clock size={14} /> {l.startTime}–{l.endTime}</span>
                    <span className="inline-flex items-center gap-1"><DoorOpen size={14} /> {l.room}-xona</span>
                  </p>
                </div>
                {l.status && <StatusBadge status={l.status} late={l.lateMinutes} />}
              </div>
              {(l.checkIn || l.checkOut) && (
                <p className="mt-3 text-sm text-ink-700">
                  Keldi: <b>{l.checkIn || '—'}</b>{l.checkOut && <> · Ketdi: <b>{l.checkOut}</b>{l.earlyLeave && <span className="text-amber-700"> (erta)</span>}</>}
                </p>
              )}
              <div className="mt-4">
                {l.action === 'in' && <Link href={`/teacher/checkin?groupId=${l.groupId}&type=in`} className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-medium text-white hover:bg-brand-700"><LogIn size={18} /> Keldim</Link>}
                {l.action === 'out' && <Link href={`/teacher/checkin?groupId=${l.groupId}&type=out`} className="flex items-center justify-center gap-2 rounded-xl border border-brand-600 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50"><LogOut size={18} /> Ketdim</Link>}
                {l.action === 'done' && <p className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-700"><CheckCircle2 size={18} /> {l.hint}</p>}
                {(l.action === 'wait' || l.action === 'closed') && <p className={cn('rounded-xl bg-ink-50 py-3 text-center text-sm', l.action === 'closed' ? 'text-red-700' : 'text-ink-500')}>{l.hint}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
