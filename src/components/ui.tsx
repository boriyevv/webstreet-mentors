'use client';
import { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

export function Button({ variant = 'primary', size = 'md', loading, className, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft'; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  const v = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-200',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50',
    ghost: 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50 disabled:opacity-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
  }[variant];
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3.5 text-base' }[size];
  return (
    <button {...p} disabled={p.disabled || loading} className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed', v, s, className)}>
      {loading && <Loader2 size={16} className="spin" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}
const inputCls = 'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100';
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, p.className)} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(inputCls, p.className)} />;

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('rounded-2xl border border-ink-200 bg-white', className)}>{children}</div>
);

const tones: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700',
  blue: 'bg-brand-50 text-brand-700', gray: 'bg-ink-100 text-ink-700',
};
export const Badge = ({ tone = 'gray', children }: { tone?: keyof typeof tones; children: React.ReactNode }) => (
  <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
);

export function StatusBadge({ status, late }: { status: string; late?: number }) {
  if (status === 'ON_TIME') return <Badge tone="green">Vaqtida</Badge>;
  if (status === 'LATE') return <Badge tone="amber">Kech qolgan{late ? ` · ${late} daq` : ''}</Badge>;
  if (status === 'ABSENT') return <Badge tone="red">Kelmagan</Badge>;
  return <Badge tone="blue">Kutilmoqda</Badge>;
}

export function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span style={{ width: size, height: size, fontSize: size * 0.36 }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700">{initials}</span>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cn('flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Yopish" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export const Spinner = () => (
  <div className="flex justify-center py-16 text-brand-600"><Loader2 className="spin" size={26} /></div>
);
export const Empty = ({ title, text }: { title: string; text?: string }) => (
  <div className="py-14 text-center"><p className="font-medium text-ink-700">{title}</p>{text && <p className="mt-1 text-sm text-ink-500">{text}</p>}</div>
);
export const ErrorBox = ({ children }: { children: React.ReactNode }) => (
  <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{children}</div>
);
export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div><h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>{sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}</div>
      {action}
    </div>
  );
}
export function ScoreBar({ score }: { score: number | null }) {
  const c = score === null ? 'bg-ink-200' : score >= 95 ? 'bg-emerald-500' : score >= 85 ? 'bg-brand-600' : score >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100"><div className={cn('h-full rounded-full', c)} style={{ width: `${score ?? 0}%` }} /></div>;
}
export const levelTone = (level: string): 'green' | 'blue' | 'amber' | 'red' | 'gray' =>
  level === "A'lo" ? 'green' : level === 'Yaxshi' ? 'blue' : level === 'Qoniqarli' ? 'amber' : level === 'Past' ? 'red' : 'gray';
