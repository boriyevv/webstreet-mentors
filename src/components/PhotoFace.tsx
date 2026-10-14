'use client'; import { useEffect, useRef, useState } from 'react'; import { Loader2 } from 'lucide-react'; import { detectorOptions, loadFace } from '@/lib/face';
type Result = { descriptor: number[]; snap: string };
export function FaceScanner({ onCapture, onError }: { onCapture: (r: Result) => void; onError: (m: string) => void }) { const video = useRef<HTMLVideoElement>(null); const [msg, setMsg] = useState('Kamera yoqilmoqda…'); const [phase, setPhase] = useState<'load' | 'find' | 'done'>('load');
useEffect(() => { let stop = false; let stream: MediaStream | null = null; let timer: any;
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

    let good = 0;
    const t0 = Date.now();

    const loop = async () => {
      if (stop) return;
      try {
        const det = await f.detectSingleFace(v, detectorOptions(f)).withFaceLandmarks().withFaceDescriptor();
        if (det && det.detection.score > 0.6) {
          const w = det.detection.box.width / v.videoWidth;
          if (w < 0.22) {
            good = 0;
            setMsg('Yaqinroq keling');
          } else {
            good++;
            setMsg('Qimirlamang…');
            if (good >= 3) {
              const c = document.createElement('canvas');
              const k = 200 / v.videoWidth;
              c.width = 200;
              c.height = Math.round(v.videoHeight * k);
              c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
              setPhase('done');
              s.getTracks().forEach((t) => t.stop());
              onCapture({ descriptor: Array.from(det.descriptor as Float32Array), snap: c.toDataURL('image/jpeg', 0.7) });
              return;
            }
          }
        } else {
          good = 0;
          setMsg("Yuz topilmadi. Yorug'roq joyda kameraga qarang");
        }
        if (Date.now() - t0 > 30000) { onError("Vaqt tugadi. Yuzingiz yorug' joyda ko'rinib tursin va qayta urinib ko'ring."); return; }
      } catch {}
      timer = setTimeout(loop, 100);
    };
    loop();
  } catch (e: any) {
    const name = e?.name || '';
    onError(name === 'NotAllowedError' ? 'Kameraga ruxsat berilmagan. Brauzer sozlamalarida kameraga ruxsat bering.' : name === 'NotFoundError' ? 'Kamera topilmadi' : e?.message || "Kamerani ochib bo'lmadi");
  }
})();

return () => {
  stop = true;
  clearTimeout(timer);
  stream?.getTracks().forEach((t) => t.stop());
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
return ( <div className="flex flex-col items-center"> <div className={relative h-72 w-72 overflow-hidden rounded-full border-4 ${phase === 'find' ? 'border-brand-600 pulse-ring' : 'border-ink-200'}}> <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" /> {phase === 'load' && <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-brand-600"><Loader2 className="spin" size={28} /></div>} </div> <p className="mt-6 min-h-[1.5rem] text-center text-sm font-medium text-ink-700" aria-live="polite">{msg}</p> </div> ); }
