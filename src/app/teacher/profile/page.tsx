'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, DoorOpen, Phone, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar, Button, Card, Empty, ErrorBox, Field, Input, Spinner } from '@/components/ui';
import { InstallButton } from '@/components/pwa';
import { DAY_SHORT } from '@/lib/time';

export default function Profile() {
  const router = useRouter();
  const [d, setD] = useState<any>(null);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api('/api/teacher/me').then(setD); }, []);

  async function changePw(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await api('/api/auth/password', { body: { current: cur, next: nw } }); setMsg({ ok: true, t: "Parol o'zgartirildi" }); setCur(''); setNw(''); }
    catch (er: any) { setMsg({ ok: false, t: er.message }); }
    setBusy(false);
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); }

  if (!d) return <Spinner />;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card className="flex items-center gap-4 p-5">
        <Avatar src={d.user.photo} name={d.user.fullName} size={72} />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{d.user.fullName}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500"><Phone size={14} /> {d.user.phone}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500"><KeyRound size={14} /> Login: {d.user.login}</p>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-base font-semibold">Mening guruhlarim</h2>
        {d.groups.length === 0 ? <Card><Empty title="Hozircha guruh biriktirilmagan" /></Card> : (
          <div className="space-y-2">
            {d.groups.map((g: any) => (
              <Card key={g.id} className="p-4">
                <p className="font-medium">{g.name}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                  <span className="inline-flex items-center gap-1"><Clock size={14} /> {g.startTime}–{g.endTime}</span>
                  <span className="inline-flex items-center gap-1"><DoorOpen size={14} /> {g.room}-xona</span>
                </p>
                <div className="mt-2.5 flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <span key={n} className={`rounded-md px-2 py-1 text-xs font-medium ${g.days.includes(n) ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-300'}`}>{DAY_SHORT[n]}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <InstallButton className="w-full" />

      <form onSubmit={changePw} className="space-y-4">
        <h2 className="text-base font-semibold">Parolni o'zgartirish</h2>
        {msg && (msg.ok ? <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{msg.t}</p> : <ErrorBox>{msg.t}</ErrorBox>)}
        <Field label="Joriy parol"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required /></Field>
        <Field label="Yangi parol" hint="Kamida 6 belgi"><Input type="password" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" minLength={6} required /></Field>
        <Button type="submit" loading={busy}>Saqlash</Button>
      </form>
      <Button variant="ghost" onClick={logout} className="w-full">Chiqish</Button>
    </div>
  );
}
