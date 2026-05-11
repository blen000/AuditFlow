import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isSafeRedirect } from '@/lib/redirect';

const PUBLIC_PATHS = ['/api/auth/login', '/login', '/register', '/favicon.ico', '/_next', '/public'];
const ACCESS_COOKIE_NAME = 'auth_access';
const REFRESH_COOKIE_NAME = 'auth_refresh';

export function middleware(req: NextRequest) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://placehold.co https://picsum.photos;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    connect-src 'self' ws: wss:;
  `.replace(/\s{2,}/g, ' ').trim();

  const { pathname } = req.nextUrl;

  // 1. Allow public paths and static assets immediately
  // Also allow common static file extensions
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|otf)$/i.test(pathname);
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || isStaticAsset) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  // ❗ Validate callbackUrl if present
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
  if (callbackUrl && !isSafeRedirect(callbackUrl, req.url)) {
    console.warn(`Blocked potentially malicious redirect: ${callbackUrl}`);
    const url = req.nextUrl.clone();
    url.searchParams.delete('callbackUrl');
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set('Content-Security-Policy', cspHeader);
    return redirectResponse;
  }

  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  
  // 2. Enforce authentication for all non-public routes
  if (!accessToken && !refreshToken) {
    if (pathname.startsWith('/api')) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 
          'content-type': 'application/json',
          'Content-Security-Policy': cspHeader
        } 
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    const loginRedirect = NextResponse.redirect(url);
    loginRedirect.headers.set('Content-Security-Policy', cspHeader);
    return loginRedirect;
  }

  // 3. Lightweight Edge-compatible JWT parsing for access token
  if (accessToken) {
    try {
      const [header, body, sig] = accessToken.split('.');
      if (!header || !body || !sig) throw new Error('Invalid token');
      
      const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
       if (!payload || !payload.userId) throw new Error('Invalid payload');
 
       // ❗ Expiration check for Access Token
       if (payload.exp && Date.now() > payload.exp * 1000) {
         throw new Error('Token expired');
       }

       // Force password change check
      if (payload.requirePasswordChange && 
          pathname !== '/force-password-change' && 
          !pathname.startsWith('/api/auth/change-password')) {
        
        const url = req.nextUrl.clone();
        url.pathname = '/force-password-change';
        const pwRedirect = NextResponse.redirect(url);
        pwRedirect.headers.set('Content-Security-Policy', cspHeader);
        return pwRedirect;
      }
    } catch (e) {
      // Access token invalid - if refresh token exists, we can let it through 
      // and handle refresh in the application, or redirect to login.
      if (!refreshToken) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        const invalidRedirect = NextResponse.redirect(url);
        invalidRedirect.headers.set('Content-Security-Policy', cspHeader);
        return invalidRedirect;
      }
    }
  }

  const finalResponse = NextResponse.next();
  finalResponse.headers.set('Content-Security-Policy', cspHeader);
  return finalResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (public)
     * - favicon.ico (public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public (public assets)
     */
    '/((?!api/auth/login|favicon.ico|_next/static|_next/image|public).*)',
  ],
};
