import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/pwa';

export const metadata: Metadata = {
  title: { default: 'Web Street Mentors', template: '%s · Web Street Mentors' },
  description: "O'qituvchilar davomatini nazorat qilish tizimi",
  applicationName: 'Web Street Mentors',
  appleWebApp: { capable: true, title: 'WS Mentors', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { themeColor: '#0a5cff', width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-white font-sans text-ink-900 antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
