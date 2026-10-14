'use client';
import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

export function InstallButton({ className = '' }: { className?: string }) {
  const [evt, setEvt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setInstalled(!!standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const h = (e: Event) => { e.preventDefault(); setEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (installed) return null;
  if (evt) {
    return (
      <button onClick={async () => { evt.prompt(); await evt.userChoice; setEvt(null); }} className={`inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ${className}`}>
        <Download size={16} /> Ilovani telefonga o'rnatish
      </button>
    );
  }
  if (ios) {
    return (
      <p className={`flex items-start gap-2 rounded-xl border border-ink-200 bg-ink-50 p-3 text-xs text-ink-700 ${className}`}>
        <Share size={14} className="mt-0.5 shrink-0 text-brand-600" />
        <span>iPhone'da o'rnatish: Safari'da <b>Ulashish</b> tugmasini bosing va <b>"Bosh ekranga qo'shish"</b> ni tanlang.</span>
      </p>
    );
  }
  return null;
}
