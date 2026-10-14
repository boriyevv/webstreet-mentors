'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarCheck, Home, LayoutDashboard, LogOut, Settings, Trophy, UserRound, Users, Layers, History } from 'lucide-react';
import { cn } from './ui';

const ICONS: Record<string, any> = { dash: LayoutDashboard, users: Users, groups: Layers, check: CalendarCheck, trophy: Trophy, settings: Settings, home: Home, history: History, user: UserRound };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function Shell({ items, name, roleLabel, children }: { items: NavItem[]; name: string; roleLabel: string; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const root = items[0].href;
  const active = (h: string) => (h === root ? path === h : path.startsWith(h));
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white p-4 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2 pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={34} height={34} className="rounded-lg" />
          <div className="leading-tight"><p className="text-sm font-semibold">Web Street</p><p className="text-xs text-brand-600">Mentors</p></div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((it) => {
            const I = ICONS[it.icon];
            return (
              <Link key={it.href} href={it.href} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', active(it.href) ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-ink-100')}>
                <I size={18} /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 pt-4">
          <p className="truncate px-2 text-sm font-medium">{name}</p>
          <p className="mb-2 px-2 text-xs text-ink-500">{roleLabel}</p>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-100"><LogOut size={18} /> Chiqish</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur md:hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold">Web Street <span className="text-brand-600">Mentors</span></span>
          </div>
          <button onClick={logout} aria-label="Chiqish" className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><LogOut size={18} /></button>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>

      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-200 bg-white md:hidden">
        {items.map((it) => {
          const I = ICONS[it.icon];
          const a = active(it.href);
          return (
            <Link key={it.href} href={it.href} className={cn('flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium', a ? 'text-brand-600' : 'text-ink-500')}>
              <I size={20} strokeWidth={a ? 2.4 : 1.8} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
