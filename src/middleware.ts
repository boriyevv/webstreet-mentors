import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, verifyToken } from '@/lib/token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await verifyToken(req.cookies.get(COOKIE)?.value);
  if (pathname === '/login') {
    if (s) return NextResponse.redirect(new URL(s.role === 'ADMIN' ? '/admin' : '/teacher', req.url));
    return NextResponse.next();
  }
  if (!s) return NextResponse.redirect(new URL('/login', req.url));
  if (pathname.startsWith('/admin') && s.role !== 'ADMIN') return NextResponse.redirect(new URL('/teacher', req.url));
  if (pathname.startsWith('/teacher') && s.role !== 'TEACHER') return NextResponse.redirect(new URL('/admin', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/login', '/admin/:path*', '/teacher/:path*'] };
