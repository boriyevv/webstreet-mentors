'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, MapPin, ScanFace, ShieldCheck } from 'lucide-react';
import { Button, ErrorBox, Field, Input } from '@/components/ui';
import { InstallButton } from '@/components/pwa';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await api<{ role: string }>('/api/auth/login', { body: { login, password } });
      router.replace(r.role === 'ADMIN' ? '/admin' : '/teacher');
      router.refresh();
    } catch (e: any) {
      setErr(e.message); setBusy(false);
    }
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={40} height={40} className="rounded-xl" />
          <span className="text-lg font-semibold">Web Street Mentors</span>
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Dars vaqtida boshlanadi, chunki hamma o'z vaqtida keladi.</h2>
          <ul className="mt-10 space-y-4 text-brand-100">
            <li className="flex items-center gap-3"><MapPin size={20} /> Faqat o'quv markaz hududida belgilanadi</li>
            <li className="flex items-center gap-3"><ScanFace size={20} /> Yuz bo'yicha tasdiqlash</li>
            <li className="flex items-center gap-3"><ShieldCheck size={20} /> Har oy adolatli reyting</li>
          </ul>
        </div>
        <p className="text-sm text-brand-200">Web Street IT Academy · Qarshi</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" width={48} height={48} className="mb-4 rounded-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tizimga kirish</h1>
            <p className="mt-1.5 text-sm text-ink-500">Administrator bergan login va parolni kiriting.</p>
          </div>
          {err && <ErrorBox>{err}</ErrorBox>}
          <Field label="Login">
            <Input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" inputMode="text" autoCapitalize="none" required />
          </Field>
          <Field label="Parol">
            <div className="relative">
              <Input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-11" />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Yashirish' : "Ko'rsatish"} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="lg" loading={busy} className="w-full">Kirish</Button>
          <InstallButton className="w-full" />
        </form>
      </div>
    </div>
  );
}
