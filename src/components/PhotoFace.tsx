'use client';
import { useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, ScanFace } from 'lucide-react';
import { Avatar } from './ui';
import { descriptorFromDataUrl, resizeImage } from '@/lib/face';

export type PhotoValue = { photo: string | null; descriptor: number[] | null };

export function PhotoFace({ value, current, onChange }: { value: PhotoValue; current?: string | null; onChange: (v: PhotoValue) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(f?: File) {
    if (!f) return;
    setErr(''); setBusy(true);
    try {
      const photo = await resizeImage(f, 400);
      const descriptor = await descriptorFromDataUrl(photo);
      onChange({ photo, descriptor });
    } catch (e: any) {
      onChange({ photo: null, descriptor: null });
      setErr(e.message || 'Rasmni tekshirib bo\'lmadi');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }
  const shown = value.photo || current || null;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">Rasm (yuz tasdiqlash uchun)</span>
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-ink-300 p-3">
        {shown ? <Avatar src={shown} name="Rasm" size={72} /> : <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-ink-100 text-ink-500"><ScanFace size={28} /></span>}
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
            {busy ? <Loader2 size={16} className="spin" /> : <Camera size={16} />} {shown ? "Rasmni almashtirish" : 'Rasm tanlash'}
          </button>
          {busy && <p className="mt-2 text-xs text-ink-500">Yuz aniqlanmoqda…</p>}
          {!busy && value.descriptor && <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 size={14} /> Yuz aniqlandi</p>}
          {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
          {!busy && !err && !value.descriptor && <p className="mt-2 text-xs text-ink-500">Yuzi aniq ko'ringan, yorug' joyda olingan, yolg'iz rasm.</p>}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
