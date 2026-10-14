'use client';
import { useEffect, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, ErrorBox, Field, Input, PageTitle, Spinner } from '@/components/ui';

export default function SettingsPage() {
  const [s, setS] = useState<any>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [pm, setPm] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { api('/api/admin/settings').then((r) => setS(r.settings)); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await api('/api/admin/settings', { method: 'PUT', body: s }); setMsg({ ok: true, t: 'Saqlandi' }); }
    catch (er: any) { setMsg({ ok: false, t: er.message }); }
    setBusy(false);
  }
  function here() {
    navigator.geolocation.getCurrentPosition((p) => setS({ ...s, centerLat: +p.coords.latitude.toFixed(6), centerLng: +p.coords.longitude.toFixed(6) }), () => setMsg({ ok: false, t: 'Joylashuvni aniqlab bo\'lmadi' }), { enableHighAccuracy: true });
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault(); setPm(null);
    try { await api('/api/auth/password', { body: { current: cur, next: nw } }); setPm({ ok: true, t: "Parol o'zgartirildi" }); setCur(''); setNw(''); }
    catch (er: any) { setPm({ ok: false, t: er.message }); }
  }
  if (!s) return <Spinner />;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value });
  return (
    <div className="max-w-2xl space-y-8">
      <PageTitle title="Sozlamalar" />
      <form onSubmit={save} className="space-y-5">
        <h2 className="text-base font-semibold">O'quv markaz joylashuvi</h2>
        {msg && (msg.ok ? <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{msg.t}</p> : <ErrorBox>{msg.t}</ErrorBox>)}
        <Field label="Nomi"><Input value={s.centerName} onChange={set('centerName')} /></Field>
        <Field label="Manzil"><Input value={s.address} onChange={set('address')} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Kenglik (lat)"><Input type="number" step="any" value={s.centerLat} onChange={set('centerLat')} required /></Field>
          <Field label="Uzunlik (lng)"><Input type="number" step="any" value={s.centerLng} onChange={set('centerLng')} required /></Field>
          <Field label="Radius (metr)"><Input type="number" value={s.radius} onChange={set('radius')} required /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="soft" size="sm" onClick={here}><Crosshair size={14} /> Hozirgi joylashuvim</Button>
          <a className="text-sm text-brand-600 underline" target="_blank" rel="noreferrer" href={`https://yandex.com/maps?text=${s.centerLat},${s.centerLng}`}>Xaritada tekshirish</a>
        </div>
        <h2 className="pt-2 text-base font-semibold">Davomat qoidalari</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Kechikish chegarasi (daq)" hint="Shundan keyin “kech” hisoblanadi"><Input type="number" value={s.graceMin} onChange={set('graceMin')} required /></Field>
          <Field label="Oldindan belgilash (daq)" hint="Dars boshlanishidan oldin"><Input type="number" value={s.earlyWindowMin} onChange={set('earlyWindowMin')} required /></Field>
          <Field label="Erta ketish (daq)" hint="Tugashidan oldin ketsa"><Input type="number" value={s.earlyLeaveMin} onChange={set('earlyLeaveMin')} required /></Field>
        </div>
        <Button type="submit" loading={busy}>Saqlash</Button>
      </form>

      <Card className="p-5">
        <form onSubmit={changePw} className="space-y-4">
          <h2 className="text-base font-semibold">Administrator parolini o'zgartirish</h2>
          {pm && (pm.ok ? <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{pm.t}</p> : <ErrorBox>{pm.t}</ErrorBox>)}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Joriy parol"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required /></Field>
            <Field label="Yangi parol"><Input type="password" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" minLength={6} required /></Field>
          </div>
          <Button type="submit" variant="ghost">Parolni almashtirish</Button>
        </form>
      </Card>
    </div>
  );
}
