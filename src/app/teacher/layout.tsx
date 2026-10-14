import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Shell, NavItem } from '@/components/Shell';

const items: NavItem[] = [
  { href: '/teacher', label: 'Bugun', icon: 'home' },
  { href: '/teacher/history', label: 'Tarix', icon: 'history' },
  { href: '/teacher/profile', label: 'Profil', icon: 'user' },
];
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s || s.role !== 'TEACHER') redirect('/login');
  return <Shell items={items} name={s.name} roleLabel="O'qituvchi">{children}</Shell>;
}
