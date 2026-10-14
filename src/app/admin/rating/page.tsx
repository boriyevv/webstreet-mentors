'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar, Badge, Card, Empty, PageTitle, ScoreBar, Spinner, levelTone } from '@/components/ui';
import { dateStr, monthLabel, monthOf, shiftMonth } from '@/lib/time';

export default function Rating() {
  const [month, setMonth] = useState(monthOf(dateStr()));
  const [d, setD] = useState<any>(null);
  useEffect(() => { setD(null); api(`/api/admin/rating?month=${month}`).then(setD); }, [month]);
  const cur = monthOf(dateStr());
  return (
    <div>
      <PageTitle title="Reyting" sub="Vaqtida kelish = 1 ball · kech = 0.7 yoki 0.4 · kelmagan = 0" action={
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Oldingi oy" className="rounded-lg p-2 hover:bg-ink-100"><ChevronLeft size={18} /></button>
          <span className="min-w-[120px] text-center text-sm font-medium">{monthLabel(month)}</span>
          <button disabled={month >= cur} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Keyingi oy" className="rounded-lg p-2 hover:bg-ink-100 disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      } />
      {!d ? <Spinner /> : d.rows.length === 0 ? <Card><Empty title="O'qituvchilar yo'q" /></Card> : (
        <Card className="divide-y divide-ink-100">
          {d.rows.map((r: any, i: number) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-4">
              <span className={`w-6 text-center text-sm font-semibold ${i < 3 && r.summary.score !== null ? 'text-brand-600' : 'text-ink-300'}`}>{i + 1}</span>
              <Avatar src={r.photo} name={r.fullName} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{r.fullName}</p>
                  <span className="text-sm font-semibold">{r.summary.score === null ? '—' : `${r.summary.score}%`}</span>
                </div>
                <div className="my-1.5"><ScoreBar score={r.summary.score} /></div>
                <p className="text-xs text-ink-500">{r.summary.total} dars · vaqtida {r.summary.onTime} · kech {r.summary.late} · qoldirgan {r.summary.absent}</p>
              </div>
              <Badge tone={levelTone(r.summary.level)}>{r.summary.level}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
