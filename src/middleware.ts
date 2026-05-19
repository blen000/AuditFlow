import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isSafeRedirect } from '@/lib/redirect';

const PUBLIC_PATHS = ['/api/auth/login', '/login', '/register', '/favicon.ico', '/_next', '/public'];
const ACCESS_COOKIE_NAME = '__Secure-auth_access';
const REFRESH_COOKIE_NAME = '__Secure-auth_refresh';
const PERMISSIONS_POLICY = 'accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=(), interest-cohort=()';

export function middleware(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data:;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProd ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim();

  const { pathname } = req.nextUrl;

  // ❗ Global Origin/Referer Validation for state-changing requests
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');

    // Strict validation: Must have origin or referer, and it must match the host
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) throw new Error();
      } catch (e) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
      }
    } else if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) throw new Error();
      } catch (e) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
      }
    } else {
      // Missing both Origin and Referer
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
  }

  // 1. Allow public paths and static assets immediately
  // Also allow common static file extensions
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|otf)$/i.test(pathname);
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || isStaticAsset) {
    const response = NextResponse.next();
    
    // ❗ Enforce HTTPS and Modern Security Headers
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', PERMISSIONS_POLICY);
    
    // ❗ Security: Remove identifying headers
    response.headers.delete('X-Powered-By');
    response.headers.delete('Server');

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

       // ❗ Contextual and Versioning Binding check
       if (!payload.fingerprint || payload.sessionVersion === undefined || payload.version === undefined) {
         throw new Error('Invalid session binding');
       }

       // Force password change check
      if (payload.requirePasswordChange && 
          pathname !== '/force-password-change' && 
          !pathname.startsWith('/api/auth/change-password') &&
          pathname !== '/api/auth/me' &&
          pathname !== '/api/auth/refresh') {
        
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

  // ❗ Session-Bound CSRF Token Validation for API routes
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && pathname.startsWith('/api') && pathname !== '/api/auth/login') {
    // Only enforced if they have an access token (i.e. authenticated requests)
    if (accessToken) {
      try {
        const [header, body, sig] = accessToken.split('.');
        const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
        const expectedCsrfToken = payload.csrfToken;
        const providedCsrfToken = req.headers.get('x-csrf-token');

        if (!expectedCsrfToken || expectedCsrfToken !== providedCsrfToken) {
          return new NextResponse(JSON.stringify({ error: 'Invalid CSRF Token' }), { 
            status: 403, 
            headers: { 'content-type': 'application/json' } 
          });
        }
      } catch (e) {
        return new NextResponse(JSON.stringify({ error: 'Invalid CSRF configuration' }), { 
          status: 403, 
          headers: { 'content-type': 'application/json' } 
        });
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
