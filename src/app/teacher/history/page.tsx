'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Empty, ScoreBar, Spinner, StatusBadge, Badge, levelTone } from '@/components/ui';
import { dateStr, fmtDate, fmtTime, monthLabel, monthOf, shiftMonth, DAY_SHORT, weekday } from '@/lib/time';

export default function History() {
  const [month, setMonth] = useState(monthOf(dateStr()));
  const [d, setD] = useState<any>(null);
  useEffect(() => { setD(null); api(`/api/teacher/history?month=${month}`).then(setD); }, [month]);
  const cur = monthOf(dateStr());
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Davomat tarixi</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Oldingi oy" className="rounded-lg p-2 hover:bg-ink-100"><ChevronLeft size={18} /></button>
          <span className="min-w-[110px] text-center text-sm font-medium">{monthLabel(month)}</span>
          <button disabled={month >= cur} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Keyingi oy" className="rounded-lg p-2 hover:bg-ink-100 disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      </div>
      {!d ? <Spinner /> : (
        <>
          <Card className="mb-5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-brand-600">{d.summary.score === null ? '—' : `${d.summary.score}%`}</p>
              <Badge tone={levelTone(d.summary.level)}>{d.summary.level}</Badge>
            </div>
            <div className="my-3"><ScoreBar score={d.summary.score} /></div>
            <p className="text-sm text-ink-500">Jami {d.summary.total} ta dars · vaqtida {d.summary.onTime} · kech {d.summary.late} · qoldirgan {d.summary.absent}</p>
          </Card>
          {d.lessons.filter((l: any) => l.status !== 'UPCOMING').length === 0 ? <Card><Empty title="Bu oyda darslar yo'q" /></Card> : (
            <div className="space-y-2">
              {d.lessons.filter((l: any) => l.status !== 'UPCOMING').map((l: any) => (
                <Card key={l.key} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.groupName}</p>
                    <p className="text-xs text-ink-500">{fmtDate(l.date)} · {DAY_SHORT[weekday(l.date)]} · {l.startTime}–{l.endTime}{l.checkIn && <> · {fmtTime(l.checkIn)}{l.checkOut && `–${fmtTime(l.checkOut)}`}</>}</p>
                  </div>
                  <StatusBadge status={l.status} late={l.lateMinutes} />
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
