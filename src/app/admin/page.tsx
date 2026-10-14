'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, Empty, PageTitle, Spinner, StatusBadge } from '@/components/ui';
import { DAY_NAMES, fmtDate, fmtTime, weekday } from '@/lib/time';

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <p className={`text-3xl font-semibold tracking-tight ${tone || 'text-ink-900'}`}>{value}</p>
      <p className="mt-1 text-sm text-ink-500">{label}</p>
    </Card>
  );
}

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    const load = () => api('/api/admin/stats').then(setD);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  if (!d) return <Spinner />;
  const c = d.counts;
  return (
    <div>
      <PageTitle title="Bugungi holat" sub={`${DAY_NAMES[weekday(d.today)]}, ${fmtDate(d.today)} · har 30 soniyada yangilanadi`} />
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Vaqtida kelganlar" value={c.onTime} tone="text-emerald-600" />
        <Stat label="Kech qolganlar" value={c.late} tone="text-amber-600" />
        <Stat label="Kelmaganlar" value={c.absent} tone="text-red-600" />
        <Stat label="Hali boshlanmagan" value={c.upcoming} tone="text-brand-600" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Faol o'qituvchilar" value={d.teachers} />
        <Stat label="Faol guruhlar" value={d.groups} />
        <Stat label="Bugungi darslar" value={c.total} />
      </div>
      <h2 className="mb-3 text-base font-semibold">Bugungi darslar</h2>
      {d.lessons.length === 0 ? <Card><Empty title="Bugun dars yo'q" /></Card> : (
        <Card className="divide-y divide-ink-100">
          {d.lessons.map((l: any) => (
            <div key={l.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{l.teacherName}</p>
                <p className="text-xs text-ink-500">{l.groupName} · {l.startTime}–{l.endTime} · {l.room}-xona{l.checkIn && ` · keldi ${fmtTime(l.checkIn)}`}{l.checkOut && ` · ketdi ${fmtTime(l.checkOut)}`}</p>
              </div>
              <StatusBadge status={l.status} late={l.lateMinutes} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
