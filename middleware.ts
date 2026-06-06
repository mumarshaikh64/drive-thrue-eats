import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseAdminSessionValue } from '@/lib/admin-session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Immediately bypass for static files, Next.js internal files, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Extract host and subdomain
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  let subdomain = '';
  const parts = hostname.split('.');

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    subdomain = '';
  } else if (hostname.endsWith('.localhost')) {
    subdomain = parts[0];
  } else if (parts.length > 2) {
    if (parts[0] !== 'www') {
      subdomain = parts[0];
    }
  }

  const session = parseAdminSessionValue(request.cookies.get('dte_admin_session')?.value);
  const isAuthenticated = Boolean(session);

  let response: NextResponse;

  // 1. Subdomain-based Routing
  if (subdomain === 'admin') {
    const targetPath = pathname.startsWith('/admin') ? pathname : `/admin${pathname}`;
    const isAdminLoginPage = targetPath === '/admin/login';

    if (isAdminLoginPage && isAuthenticated) {
      response = NextResponse.redirect(new URL('/', request.url));
    } else if (!isAdminLoginPage && !isAuthenticated) {
      response = NextResponse.redirect(new URL('/login', request.url));
    } else if (!pathname.startsWith('/admin')) {
      response = NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (subdomain === 'waiter') {
    if (!pathname.startsWith('/waiter')) {
      response = NextResponse.rewrite(new URL(`/waiter${pathname}`, request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (subdomain === 'chef') {
    if (!pathname.startsWith('/chef')) {
      response = NextResponse.rewrite(new URL(`/chef${pathname}`, request.url));
    } else {
      response = NextResponse.next();
    }
  } else {
    // 2. Fallback Path-based Routing (for domain.com/admin, domain.com/waiter etc.)
    if (pathname.startsWith('/admin')) {
      const isAdminLoginPage = pathname === '/admin/login';
      if (isAdminLoginPage && isAuthenticated) {
        response = NextResponse.redirect(new URL('/admin', request.url));
      } else if (!isAdminLoginPage && !isAuthenticated) {
        response = NextResponse.redirect(new URL('/admin/login', request.url));
      } else {
        response = NextResponse.next();
      }
    } else {
      response = NextResponse.next();
    }
  }

  // Set the subdomain cookie for RootLayout SSR
  response.cookies.set('dte_subdomain', subdomain, { path: '/' });

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static assets and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
