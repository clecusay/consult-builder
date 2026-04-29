# Security Issues — Consult Builder

Identified 2026-04-29. Organized by severity.

---

## CRITICAL

### 1. Stored XSS via `raw()` in widget success flow
- **Files:** `apps/widget/src/main.ts:1358,1376`
- **Issue:** Success flow body HTML from the API is rendered with `raw()`, which bypasses all HTML escaping. A compromised admin account can inject `<script>` tags that execute in every patient's browser.
- **Code:**
  ```typescript
  <div class="tb-success-flow-body">${raw(flow.thank_you.body)}</div>
  <div class="tb-success-flow-body">${raw(flow.doctor_profile.body)}</div>
  ```
- **Fix:** Add `dompurify` to the widget, create a `sanitize()` wrapper in `template.ts`, replace `raw()` calls on user-controlled content with `sanitize()`.

### 2. No authentication on POST `/api/auth/setup`
- **File:** `apps/web/app/api/auth/setup/route.ts`
- **Issue:** Creates tenants and assigns `center_admin` role with zero authentication. Any caller can create a tenant with any `user_id`, effectively hijacking accounts.
- **Fix:** Use `createServerSupabaseClient()` to get the authenticated session. Verify `auth.getUser()` returns a valid user and that `user_id` in the request body matches the authenticated user's ID. Return 401 if unauthenticated.

### 3. Open redirect in `/auth/callback`
- **File:** `apps/web/app/auth/callback/route.ts:7,13`
- **Issue:** The `next` query parameter is user-controlled and used directly in `NextResponse.redirect()`. An attacker can craft `/auth/callback?code=xxx&next=//evil.com` to redirect users to phishing sites.
- **Fix:** Validate that `next` starts with `/` and does NOT start with `//`. Strip any protocol or host. Default to `/dashboard` if invalid.

---

## HIGH

### 4. Unvalidated iframe/link URLs from config
- **File:** `apps/widget/src/main.ts:1398,1403`
- **Issue:** Calendar URLs from the API config are injected directly into iframe `src` and anchor `href` without protocol validation. Could be `javascript:` or `data:` URLs.
- **Fix:** Validate URLs are `https://` only before rendering. Add `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` attribute to the calendar iframe.

### 5. Unescaped HTML in notification emails
- **File:** `apps/web/lib/email/send-notification.ts:51`
- **Issue:** User-submitted form values (`r.label`, `r.value`) are interpolated directly into HTML email template strings without escaping. Enables HTML injection in notification emails.
- **Code:**
  ```typescript
  `<tr><td ...>${r.label}</td><td ...>${r.value}</td></tr>`
  ```
- **Fix:** Add an `escapeHtml()` helper that encodes `& < > " '` and apply to all interpolated values.

### 6. In-memory rate limiting (not distributed)
- **File:** `apps/web/lib/rate-limit.ts`
- **Issue:** Rate limiter uses an in-memory `Map` that resets on each serverless cold start and isn't shared across instances. The `x-forwarded-for` header used for IP identification is spoofable.
- **Fix:** Swap to `@upstash/ratelimit` with Upstash Redis for distributed rate limiting (TODO already exists in code).

### 7. Service role key in public API routes
- **Files:** `apps/web/app/api/widget/config/route.ts`, `apps/web/app/api/widget/submit/route.ts`, `apps/web/app/api/auth/setup/route.ts`
- **Issue:** Public-facing endpoints use `createServiceRoleClient()` which bypasses all RLS policies. Any validation bugs expose all tenant data.
- **Fix:** Evaluate which operations truly need service role. Consider using a scoped service account or applying RLS even for these routes.

### 8. Unrestricted `custom_fields` in form submission
- **File:** `apps/web/app/api/widget/submit/route.ts:40`
- **Issue:** `custom_fields: z.record(z.unknown())` accepts arbitrary nested objects including potential XSS payloads that get stored in DB, sent to webhooks, and rendered in emails unescaped.
- **Fix:** Restrict to flat values only: `z.record(z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]))`. Add `.max(50)` to limit number of fields.

---

## MEDIUM

### 9. No origin validation on widget endpoints (CORS `*`)
- **Files:** `apps/web/app/api/widget/config/route.ts:411`, `apps/web/app/api/widget/submit/route.ts:235`
- **Issue:** Both endpoints use `Access-Control-Allow-Origin: *` with no origin checking. The `allowed_origins` field exists in WidgetConfig but is never enforced. Phishing sites can embed legitimate tenant widgets.
- **Fix:** Create a `validateOrigin()` helper. If `allowed_origins` is non-empty, validate the request `Origin` header against it. If empty/null, allow all (backwards compatible). Return matched origin as the CORS header.

### 10. CSS sanitization is regex-based (bypassable)
- **File:** `apps/web/lib/sanitize-css.ts`
- **Issue:** Uses regex blacklisting (`@import`, `url()`, `expression()`) which can be bypassed with CSS encoding tricks, backslash sequences, and other obfuscation.
- **Fix:** Add blocks for `<style>` tags, encoded backslash sequences, `content:` with `attr()` exfiltration, and maximum length enforcement (10KB). Consider switching to a CSS parser (PostCSS) for proper validation.

### 11. No CSP `frame-src` directive
- **File:** `apps/web/next.config.ts`
- **Issue:** CSP exists but lacks `frame-src` to restrict iframe sources. The `script-src 'unsafe-inline'` is needed for Next.js but increases XSS impact.
- **Fix:** Add `frame-src` directive to restrict allowed iframe origins in the dashboard.

### 12. Open Shadow DOM on widget
- **File:** `apps/widget/src/main.ts:134`
- **Issue:** Widget uses `mode: 'open'` shadow DOM, allowing the host page to inspect and manipulate widget internals.
- **Fix:** Switch to `mode: 'closed'` for better encapsulation.

### 13. `source_url` leaks full URL including query params
- **File:** `apps/widget/src/main.ts:1680`
- **Issue:** `window.location.href` is sent as `source_url` in form submissions, potentially leaking sensitive query parameters from the embedding page.
- **Fix:** Strip query parameters, sending only `window.location.origin + window.location.pathname`.

---

## LOW

### 14. Basic email regex allows invalid addresses
- **File:** `apps/widget/src/main.ts:1594`
- **Issue:** Email validation regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` allows addresses like `test@test.t`. Server-side Zod validation is stricter (uses `.email()`), so this is cosmetic.
- **Fix:** Use a stricter client-side regex or rely on the `type="email"` HTML attribute for browser-native validation.

### 15. No phone/date format validation on widget form
- **File:** `apps/widget/src/main.ts` (form validation section)
- **Issue:** Phone and date of birth fields have no client-side format validation. Server accepts them as optional strings.
- **Fix:** Add basic format validation (phone: digits/dashes/parens, DOB: valid date format).

### 16. Webhook delivery is fire-and-forget
- **File:** `apps/web/app/api/widget/submit/route.ts:151-204`
- **Issue:** Webhook delivery runs in a non-awaited async IIFE. Failures are logged but the client is told the submission succeeded. Status is updated in DB asynchronously.
- **Fix:** Document this behavior. Consider adding monitoring/alerting for failed webhooks. Optionally await delivery and return status.

### 17. Audit log insert has no rate limiting
- **File:** `apps/web/lib/audit/client.ts`
- **Issue:** RLS allows any authenticated user to create audit logs without rate limiting. Could be abused to spam the audit_logs table.
- **Fix:** Add app-level rate limiting or restrict the insert policy to specific roles.

### 18. Webhook secret stored in plaintext
- **Issue:** `webhook_secret` is stored as plaintext in `widget_configs` table. If the DB is compromised, all webhook secrets are exposed.
- **Fix:** Consider encrypting at rest or using a secrets manager. Lower priority since DB access already implies full compromise.

---

## Already Done Well

- RLS enabled on all tables with proper tenant isolation policies
- Zod schemas validate API input types on all endpoints
- Webhook signing uses HMAC-SHA256 with timestamps
- SSRF protection blocks private IP ranges for webhook URLs (`lib/webhooks/validate-url.ts`)
- TipTap rich text editor restricts output to safe markup elements
- Auth middleware properly refreshes sessions and protects dashboard routes
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) configured in `next.config.ts`
- Webhook delivery enforces HTTPS in production

---

## Tracking

| #  | Severity | Status | Notes |
|----|----------|--------|-------|
| 1  | CRITICAL | ✅ Fixed | `sanitize()` replaces `raw()` for user content |
| 2  | CRITICAL | ✅ Fixed | Auth + user_id match enforced |
| 3  | CRITICAL | ✅ Fixed | `safeRedirect()` validates path |
| 4  | HIGH     | ✅ Fixed | `https://` check + iframe sandbox |
| 5  | HIGH     | ✅ Fixed | `escapeHtml()` applied to all interpolated values |
| 6  | HIGH     | ⚠️ Partial | Cleanup fixed; IP extraction still uses spoofable headers |
| 7  | HIGH     | ❌ Open | Still uses `createServiceRoleClient()` — acceptable tradeoff, see note below |
| 8  | HIGH     | ✅ Fixed | Values restricted to flat types; `.refine()` limits to 50 fields max |
| 9  | MEDIUM   | ✅ Fixed | `getCorsOrigin()` validates against `allowed_origins` |
| 10 | MEDIUM   | ❌ Open | Still regex-based — low risk given current usage |
| 11 | MEDIUM   | ✅ Fixed | `frame-src 'self'` added to CSP |
| 12 | MEDIUM   | ✅ Fixed | Shadow DOM `mode: 'closed'` |
| 13 | MEDIUM   | ✅ Fixed | `source_url` uses `origin + pathname` only |
| 14 | LOW      | ✅ Acceptable | Server-side Zod `.email()` is the real gate |
| 15 | LOW      | ❌ Open | Browser HTML5 validation only — low risk |
| 16 | LOW      | ❌ Won't fix | By design; DB tracks status for monitoring |
| 17 | LOW      | ❌ Open | Low risk — requires authenticated user |
| 18 | LOW      | ❌ Won't fix | DB compromise = full compromise anyway |

### Notes on open items

**#7 — Service role in public routes:** These routes need to read data across tenants (config) and write submissions without a user session. Service role is the correct approach here as long as input validation (Zod) is solid, which it is. Switching to RLS would require anonymous-role policies that are harder to reason about. **Accepted risk.**

**#10 — CSS sanitization:** Custom CSS is only settable by authenticated admins via the dashboard. The regex blocks the most common attack vectors. PostCSS migration is nice-to-have but not urgent given the limited attack surface (admin-only input).

**#15, #17 — Phone validation, audit rate limit:** Both are low-impact. Phone/date are optional fields validated by browser HTML5 attributes and stored as strings. Audit log abuse requires a valid authenticated session.
