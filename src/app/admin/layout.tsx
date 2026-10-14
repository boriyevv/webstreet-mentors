import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Shell, NavItem } from '@/components/Shell';

const items: NavItem[] = [
  { href: '/admin', label: 'Bosh sahifa', icon: 'dash' },
  { href: '/admin/teachers', label: "O'qituvchilar", icon: 'users' },
  { href: '/admin/groups', label: 'Guruhlar', icon: 'groups' },
  { href: '/admin/attendance', label: 'Davomat', icon: 'check' },
  { href: '/admin/rating', label: 'Reyting', icon: 'trophy' },
  { href: '/admin/settings', label: 'Sozlamalar', icon: 'settings' },
];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') redirect('/login');
  return <Shell items={items} name={s.name} roleLabel="Administrator">{children}</Shell>;
}
