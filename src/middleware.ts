import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isSafeRedirect } from '@/lib/redirect';

const PUBLIC_PATHS = ['/api/auth/login', '/login', '/register', '/favicon.ico', '/_next', '/public'];
const ACCESS_COOKIE_NAME = '__Secure-auth_access';
const REFRESH_COOKIE_NAME = '__Secure-auth_refresh';
const PERMISSIONS_POLICY = 'accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=(), interest-cohort=()';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];
const PASSWORD_CHANGE_EXEMPT_PATHS = ['/force-password-change', '/api/auth/change-password', '/api/auth/me', '/api/auth/refresh', '/api/auth/csrf'];

// ❗ Helper: Generate CSP header
function generateCspHeader(nonce: string, isProd: boolean): string {
  // 'strict-dynamic' propagates trust from nonce-approved scripts to their dynamic imports,
  // covering Next.js chunk loading. Modern browsers ignore 'unsafe-inline' when
  // 'strict-dynamic' is present; it is omitted here entirely.
  // 'unsafe-eval' is retained in development only (webpack HMR source maps).
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;

  return `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProd ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim();
}

// ❗ Helper: Add security headers to response
function setSecurityHeaders(response: NextResponse, cspHeader: string): void {
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', PERMISSIONS_POLICY);
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
}

// ❗ Helper: Parse JWT token
function parseToken(token: string): Record<string, any> | null {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    return payload || null;
  } catch {
    return null;
  }
}

// ❗ Helper: Validate token expiration
function isTokenExpired(payload: Record<string, any>): boolean {
  return payload.exp ? Date.now() > payload.exp * 1000 : false;
}

// ❗ Helper: Validate origin/referer for state-changing requests
function validateOriginReferer(req: NextRequest): NextResponse | null {
  const method = req.method.toUpperCase();
  if (!STATE_CHANGING_METHODS.includes(method)) return null;

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');

  // Helper to validate URL matches host
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.host === host;
    } catch {
      return false;
    }
  };

  // Require either valid origin or valid referer
  if (origin && !isValidUrl(origin)) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    });
  }
  if (!origin && referer && !isValidUrl(referer)) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    });
  }
  if (!origin && !referer) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    });
  }

  return null;
}

// ❗ Helper: Check if path is public
function isPublicPath(pathname: string): boolean {
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|otf)$/i.test(pathname);
  return PUBLIC_PATHS.some(p => pathname.startsWith(p)) || isStaticAsset;
}

// ❗ Helper: Validate callback URL
function validateCallbackUrl(req: NextRequest, cspHeader: string): NextResponse | null {
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
  if (!callbackUrl || isSafeRedirect(callbackUrl, req.url)) return null;

  console.warn('Blocked potentially malicious redirect', { callbackUrl });
  const url = req.nextUrl.clone();
  url.searchParams.delete('callbackUrl');
  const redirectResponse = NextResponse.redirect(url);
  setSecurityHeaders(redirectResponse, cspHeader);
  return redirectResponse;
}

// ❗ Helper: Respond to unauthenticated requests
function handleUnauthenticated(pathname: string, cspHeader: string, req: NextRequest): NextResponse {
  if (pathname.startsWith('/api')) {
    const r = new NextResponse(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
    setSecurityHeaders(r, cspHeader);
    return r;
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('callbackUrl', pathname);
  const r = NextResponse.redirect(url);
  setSecurityHeaders(r, cspHeader);
  return r;
}

// ❗ Helper: Validate access token and enforce token-level guards
function validateAccessToken(
  accessToken: string,
  refreshToken: string | undefined,
  pathname: string,
  cspHeader: string,
  req: NextRequest
): NextResponse | null {
  const payload = parseToken(accessToken);
  const isInvalidOrExpired = !payload?.userId || isTokenExpired(payload);

  if (isInvalidOrExpired) {
    if (refreshToken) return null; // Refresh flow will re-authenticate
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    const r = NextResponse.redirect(url);
    setSecurityHeaders(r, cspHeader);
    return r;
  }

  const pwError = checkPasswordChangeRequired(payload!, pathname);
  if (pwError) {
    setSecurityHeaders(pwError, cspHeader);
    return pwError;
  }

  const csrfError = validateCsrfToken(req, payload!);
  if (csrfError) {
    setSecurityHeaders(csrfError, cspHeader);
    return csrfError;
  }

  return null;
}

// ❗ Helper: Validate password change requirement
function checkPasswordChangeRequired(payload: Record<string, any>, pathname: string): NextResponse | null {
  if (!payload.requirePasswordChange || PASSWORD_CHANGE_EXEMPT_PATHS.includes(pathname)) {
    return null;
  }

  const url = new URL(pathname, 'http://localhost');
  url.pathname = '/force-password-change';
  return NextResponse.redirect(url);
}

// ❗ Helper: Validate CSRF token
function validateCsrfToken(req: NextRequest, payload: Record<string, any>): NextResponse | null {
  const method = req.method.toUpperCase();
  const pathname = req.nextUrl.pathname;
  
  if (!STATE_CHANGING_METHODS.includes(method) || !pathname.startsWith('/api') || pathname === '/api/auth/login') {
    return null;
  }

  const expectedCsrfToken = payload.csrfToken;
  const providedCsrfToken = req.headers.get('x-csrf-token');

  if (!expectedCsrfToken || expectedCsrfToken !== providedCsrfToken) {
    return new NextResponse(JSON.stringify({ error: 'Invalid CSRF Token' }), { 
      status: 403, 
      headers: { 'content-type': 'application/json' } 
    });
  }

  return null;
}

export function middleware(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const nonce = btoa(crypto.randomUUID());
  const cspHeader = generateCspHeader(nonce, isProd);
  const { pathname } = req.nextUrl;

  // Forward nonce via request header for every route so Next.js can stamp its
  // bootstrap and chunk <script> tags with the matching nonce attribute.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  // Step 1: Validate origin/referer for state-changing requests
  const originError = validateOriginReferer(req);
  if (originError) {
    setSecurityHeaders(originError, cspHeader);
    return originError;
  }

  // Step 2: Allow public paths and static assets
  if (isPublicPath(pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    setSecurityHeaders(response, cspHeader);
    return response;
  }

  // Step 3: Validate callback URL
  const callbackError = validateCallbackUrl(req, cspHeader);
  if (callbackError) return callbackError;

  // Step 4: Check authentication tokens
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!accessToken && !refreshToken) {
    return handleUnauthenticated(pathname, cspHeader, req);
  }

  // Step 5: Validate access token
  if (accessToken) {
    const tokenError = validateAccessToken(accessToken, refreshToken, pathname, cspHeader, req);
    if (tokenError) return tokenError;
  }

  // Step 6: Allow request and attach security headers
  const finalResponse = NextResponse.next({ request: { headers: requestHeaders } });
  setSecurityHeaders(finalResponse, cspHeader);
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
