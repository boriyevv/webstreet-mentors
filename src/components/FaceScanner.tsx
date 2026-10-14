'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { detectorOptions, eyeAspect, loadFace } from '@/lib/face';

type Result = { descriptor: number[]; snap: string };

// Yuz aniqlanadi, so'ng jonli odam ekanini tekshirish uchun ko'z pirpiratish talab qilinadi.
export function FaceScanner({ onCapture, onError }: { onCapture: (r: Result) => void; onError: (m: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState('Kamera yoqilmoqda…');
  const [phase, setPhase] = useState<'load' | 'find' | 'blink' | 'done'>('load');

  useEffect(() => {
    let stop = false;
    let stream: MediaStream | null = null;
    let timer: any;

    (async () => {
      try {
        const [f, s] = await Promise.all([
          loadFace(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }),
        ]);
        stream = s;
        if (stop) { s.getTracks().forEach((t) => t.stop()); return; }
        const v = video.current!;
        v.srcObject = s;
        await v.play();
        setPhase('find');
        setMsg('Yuzingizni doira ichiga joylang');

        let seenOpen = 0;
        let closedSeen = false;
        let blinked = false;
        const t0 = Date.now();

        const loop = async () => {
          if (stop) return;
          try {
            const det = await f.detectSingleFace(v, detectorOptions(f)).withFaceLandmarks();
            if (det && det.detection.score > 0.6) {
              const w = det.detection.box.width / v.videoWidth;
              if (w < 0.25) { setMsg('Yaqinroq keling'); seenOpen = 0; }
              else {
                const lm = det.landmarks;
                const ear = (eyeAspect(lm.getLeftEye()) + eyeAspect(lm.getRightEye())) / 2;
                if (!blinked) {
                  setPhase('blink');
                  setMsg('Ko\'zingizni bir marta pirpirating');
                  if (ear > 0.26) seenOpen++;
                  if (seenOpen >= 2 && ear < 0.2) closedSeen = true;
                  if (closedSeen && ear > 0.26) { blinked = true; seenOpen = 0; setMsg('Tekshirilmoqda…'); }
                } else {
                  // ko'z ochiq kadrda deskriptor olinadi
                  const full = await f.detectSingleFace(v, detectorOptions(f)).withFaceLandmarks().withFaceDescriptor();
                  if (full) {
                    const c = document.createElement('canvas');
                    const k = 200 / v.videoWidth;
                    c.width = 200; c.height = Math.round(v.videoHeight * k);
                    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
                    setPhase('done');
                    s.getTracks().forEach((t) => t.stop());
                    onCapture({ descriptor: Array.from(full.descriptor as Float32Array), snap: c.toDataURL('image/jpeg', 0.7) });
                    return;
                  }
                }
              }
            } else {
              seenOpen = 0;
              setMsg('Yuz topilmadi. Yorug\'roq joyda kameraga qarang');
            }
            if (!blinked && Date.now() - t0 > 25000) { onError('Vaqt tugadi. Qayta urinib ko\'ring.'); return; }
          } catch {}
          timer = setTimeout(loop, 90);
        };
        loop();
      } catch (e: any) {
        const name = e?.name || '';
        onError(name === 'NotAllowedError' ? "Kameraga ruxsat berilmagan. Brauzer sozlamalarida kameraga ruxsat bering." : name === 'NotFoundError' ? 'Kamera topilmadi' : e?.message || 'Kamerani ochib bo\'lmadi');
      }
    })();

    return () => {
      stop = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className={`relative h-72 w-72 overflow-hidden rounded-full border-4 ${phase === 'blink' ? 'border-brand-600 pulse-ring' : 'border-ink-200'}`}>
        <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        {phase === 'load' && <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-brand-600"><Loader2 className="spin" size={28} /></div>}
      </div>
      <p className="mt-6 min-h-[1.5rem] text-center text-sm font-medium text-ink-700" aria-live="polite">{msg}</p>
    </div>
  );
}
