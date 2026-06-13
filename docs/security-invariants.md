# AuditFlow — Security Invariants

This document captures the security properties that must hold at every deployment. Use it as a pre-deploy checklist and as a reference when modifying auth, session, or permission code.

---

## 1. JWT Payload

| Property | Value | Invariant |
|---|---|---|
| `userId` | DB user UUID | Identifies the subject; verified against DB on every request |
| `sessionId` | DB session UUID | Must exist in `Session` table; missing → reject |
| `csrfToken` | 32-byte hex random | Embedded at session creation; rotated on every token refresh |
| `requirePasswordChange` | boolean | Forces password-change flow; cleared only after successful password change |
| **Permissions** | **not stored** | **Never cached in JWT; always fetched fresh from DB (see §3)** |

No other security-sensitive values belong in the JWT payload. Adding them requires explicit review against the DB-fresh policy.

---

## 2. Cookie Attributes

Both `__Secure-auth_access` and `__Secure-auth_refresh` must be set as:

```
HttpOnly: true
Secure: true
SameSite: strict
```

No session or CSRF cookie may be readable by JavaScript. The CSRF token is exposed only through `GET /api/auth/csrf`, which reads it from the verified HttpOnly JWT and returns it in the response body (protected by the Same-Origin Policy).

**Verify before deploying**: open browser DevTools → Application → Cookies and confirm no `HttpOnly` checkbox is unchecked for auth cookies.

---

## 3. Permission Freshness

Permissions are **never stored in the JWT**. On every authenticated request, both `getUserFromRequest` and `getUserFromCookiesServer` execute:

```typescript
prisma.session.findUnique({
  where: { id: payload.sessionId },
  include: { user: { include: { role: true } } }
});
```

This means:

- Permission changes (via `updateRole`) take effect on the **very next request** — no session invalidation required.
- Role reassignment (via `updateUser`) invalidates the target user's sessions as defense-in-depth, but correctness does not depend on it.
- There is no window between a permission change and enforcement.

**Do not add permissions to `signToken` calls.** If you do, the DB-fresh guarantee breaks and you must implement explicit session invalidation for all permission changes.

---

## 4. Session Invalidation Sites

All bulk session deletions are **user-scoped** (they only delete sessions belonging to a specific user) and cannot affect other users' sessions.

| Trigger | Function called | Scope | Can affect performing admin? |
|---|---|---|---|
| Successful login | `deleteMany({ userId: user.id })` directly | Target user only | No — admin logs in as themselves |
| Logout | `invalidateSession(sessionId)` | Current session only | Own session (intended) |
| User role reassignment | `invalidateAllUserSessions(id)` | Target user only | Blocked: admin cannot change own role (line 371, `users.ts`) |
| User deactivated | `invalidateAllUserSessions(id)` | Target user only | No |
| Credential reset (resendInvitation) | `invalidateAllUserSessions(id)` | Target user only | No |
| Password change | `invalidateAllUserSessions(userId)` then `createSecureSession` | Same user; replacement session created immediately | Own action (intended) |
| Inactive account detected | `session.delete({ id: session.id })` | Single session of inactive user | No |
| Session expired (absolute) | `session.delete({ id: session.id })` | Single expired session | No |
| Session idle timeout | `session.delete({ id: session.id })` | Single idle session | No |

**Invariant**: No code path deletes sessions belonging to a user other than the explicitly targeted user. Adding a new `deleteMany` that is not scoped by `userId` or `sessionId` must be reviewed.

---

## 5. User Status Enforcement

Active/Inactive status is checked at the **session validation layer**, before any authorization decision. Both `getUserFromRequest` and `getUserFromCookiesServer` check:

```typescript
if (session.user.status !== 'Active') {
  await prisma.session.delete({ where: { id: session.id } });
  return null;
}
```

This check runs **before** the idle timeout and expiry checks, so a deactivated user is rejected even if their token and session are otherwise valid.

The status check in `getUserFrom*` is redundant with `invalidateAllUserSessions` called during deactivation. Both must stay: the invalidation handles sessions that may outlive the status change (e.g., if the invalidation call races against an in-flight request).

---

## 6. Content Security Policy

The CSP is nonce-based (`'nonce-<value>' 'strict-dynamic'`) and generated per-request in Edge middleware. The nonce is:

- Generated as `btoa(crypto.randomUUID())` — 22 characters of base64-encoded random UUID
- Injected into `x-nonce` request header
- Read by the Next.js runtime to authorize bootstrap inline scripts

`'unsafe-inline'` must **not** appear in `script-src` in production. `'strict-dynamic'` in combination with a valid nonce causes browsers to ignore `'unsafe-inline'` if present, but the policy must not rely on this.

`style-src` retains `'unsafe-inline'` for Tailwind/Radix styles. This is accepted risk; a hash-based approach would require post-build tooling.

Google Fonts CDN must not appear in `style-src` or `font-src`. Fonts are self-hosted via `next/font/google` (bundle-time download).

---

## 7. CSRF Protection

CSRF protection uses the double-submit pattern implemented without a non-HttpOnly cookie:

1. Server embeds `csrfToken` in the HttpOnly access JWT at session creation.
2. Client fetches token via `GET /api/auth/csrf` (reads from JWT, returns in response body).
3. Client sends token as `X-CSRF-Token` header on mutating requests.
4. Server verifies header value matches payload in the verified JWT.

`/api/auth/csrf` must remain in `PASSWORD_CHANGE_EXEMPT_PATHS` in middleware — it is needed before the user has changed their password and must not be blocked by the force-password-change redirect.

---

## 8. TLS Configuration

**Application layer** (`web.config`): HTTP requests are permanently redirected to HTTPS by the IIS rewrite rule.

**Server layer**: Run `scripts/server-hardening/disable-legacy-tls.ps1` as Administrator and reboot to disable SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1, RC4 ciphers, and 3DES. TLS 1.2 and TLS 1.3 are explicitly enabled.

**Verify after reboot**:
```
openssl s_client -connect <host>:443 -tls1_1   # must fail
openssl s_client -connect <host>:443 -tls1_2   # must succeed
```

---

## 9. Dependency Security

Run `npm run audit:deps` before every deployment. Failing audits at `moderate` or above must be resolved or have an accepted risk decision documented before the build ships.

The PostCSS override in `package.json` forces `next`'s nested `postcss` to `^8.5.10`. Verify this holds after Next.js upgrades with `npm list postcss`.

---

## 10. Log Safety

User-controlled strings must never appear as format specifiers or interpolated directly into log calls. All `console.warn` / `console.error` / `logSecurityEvent` calls must pass structured objects:

```typescript
// Correct
console.warn('Event description', { field: userControlledValue });

// Wrong — CWE-117 log injection
console.warn(`Event: ${userControlledValue}`);
```

This applies to: `serverAuth.ts`, `authorization.ts`, `securityLogger.ts`, `middleware.ts`, `users.ts`, and any future code that logs request-derived data.
