'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, MapPin, MapPinOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { haversine } from '@/lib/geo';
import { Button, Card, ErrorBox } from '@/components/ui';
import { FaceScanner } from '@/components/FaceScanner';
import { fmtTime } from '@/lib/time';

type Pos = { lat: number; lng: number; accuracy: number };

function CheckIn() {
  const sp = useSearchParams();
  const router = useRouter();
  const groupId = sp.get('groupId') || '';
  const type = sp.get('type') === 'out' ? 'out' : 'in';
  const [center, setCenter] = useState<{ lat: number; lng: number; radius: number; name: string } | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [geoErr, setGeoErr] = useState('');
  const [locating, setLocating] = useState(true);
  const [step, setStep] = useState<'loc' | 'face' | 'send' | 'ok'>('loc');
  const [err, setErr] = useState('');
  const [result, setResult] = useState<any>(null);
  const [attempt, setAttempt] = useState(0);

  const locate = useCallback(() => {
    setLocating(true); setGeoErr(''); setErr('');
    if (!navigator.geolocation) { setGeoErr('Qurilmangiz joylashuvni qo\'llab-quvvatlamaydi'); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }); setLocating(false); },
      (e) => {
        setGeoErr(e.code === 1 ? 'Joylashuvga ruxsat berilmagan. Sozlamalarda joylashuvni yoqing va sahifani yangilang.' : 'Joylashuvni aniqlab bo\'lmadi. GPS yoqilganini tekshiring.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { api('/api/teacher/today').then((d) => setCenter(d.center)).catch((e) => setErr(e.message)); locate(); }, [locate]);

  const dist = pos && center ? Math.round(haversine(pos.lat, pos.lng, center.lat, center.lng)) : null;
  const inside = dist !== null && center ? dist <= center.radius : false;

  async function submit(r: { descriptor: number[]; snap: string }) {
    if (!pos) return;
    setStep('send');
    try {
      const res = await api('/api/teacher/checkin', { body: { groupId, type, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, descriptor: r.descriptor, snap: r.snap } });
      setResult(res); setStep('ok');
    } catch (e: any) {
      setErr(e.message); setStep('loc'); setAttempt((a) => a + 1);
      if (e.data?.code === 'OUT_OF_RANGE') locate();
    }
  }

  const title = type === 'in' ? 'Keldim' : 'Ketdim';
  return (
    <div className="mx-auto max-w-md">
      <button onClick={() => router.push('/teacher')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500"><ArrowLeft size={16} /> Orqaga</button>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">{title}ni tasdiqlash</h1>

      {step === 'ok' ? (
        <Card className="p-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
          <h2 className="mt-4 text-lg font-semibold">{type === 'in' ? 'Kelganingiz qayd etildi' : 'Ketganingiz qayd etildi'}</h2>
          <p className="mt-1 text-sm text-ink-500">Vaqt: {fmtTime(result.time)}</p>
          {result.late && <p className="mt-3 rounded-xl bg-amber-50 py-2 text-sm text-amber-700">{result.lateMinutes} daqiqa kech qoldingiz</p>}
          {result.early && <p className="mt-3 rounded-xl bg-amber-50 py-2 text-sm text-amber-700">Dars tugamasdan ketdingiz</p>}
          <Button className="mt-6 w-full" onClick={() => router.replace('/teacher')}>Bosh sahifaga qaytish</Button>
        </Card>
      ) : (
        <>
          <Card className="mb-5 p-4">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${locating ? 'bg-ink-100 text-ink-500' : inside ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {locating ? <Loader2 size={20} className="spin" /> : inside ? <MapPin size={20} /> : <MapPinOff size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                {locating && <p className="text-sm font-medium">Joylashuv aniqlanmoqda…</p>}
                {!locating && geoErr && <p className="text-sm font-medium text-red-700">{geoErr}</p>}
                {!locating && !geoErr && dist !== null && (inside
                  ? <><p className="text-sm font-medium text-emerald-700">Siz o'quv markaz hududidasiz</p><p className="text-xs text-ink-500">Markazdan ~{dist} m · aniqlik ±{Math.round(pos!.accuracy)} m</p></>
                  : <><p className="text-sm font-medium text-red-700">Siz o'quv markaz hududida emassiz</p><p className="text-xs text-ink-500">Markazdan ~{dist} m uzoqdasiz. Ruxsat etilgan masofa: {center?.radius} m</p></>)}
              </div>
              <button onClick={locate} aria-label="Qayta aniqlash" className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><RefreshCw size={18} /></button>
            </div>
          </Card>

          {err && <div className="mb-5"><ErrorBox>{err}</ErrorBox></div>}

          {step === 'send' && <div className="flex flex-col items-center py-10 text-brand-600"><Loader2 size={32} className="spin" /><p className="mt-3 text-sm text-ink-700">Yuborilmoqda…</p></div>}

          {step === 'loc' && !locating && inside && (
            <div className="flex justify-center">
              <Button size="lg" className="w-full" onClick={() => { setErr(''); setStep('face'); }}>{attempt ? 'Qayta urinish' : 'Yuzni tekshirishni boshlash'}</Button>
            </div>
          )}
          {step === 'face' && (
            <FaceScanner onCapture={submit} onError={(m) => { setErr(m); setStep('loc'); setAttempt((a) => a + 1); }} />
          )}
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><CheckIn /></Suspense>;
}
