# Admin Portal Refactor Plan

> Code quality review completed 2026-04-29. Issues organized by priority with implementation notes.

---

## Phase 1 — Critical Security Fixes

These should be addressed before any feature work.

### 1.1 Enforce CORS `allowed_origins`

- **Files:** `apps/web/app/api/widget/config/route.ts`, `apps/web/app/api/widget/submit/route.ts`
- **Problem:** Both routes set `Access-Control-Allow-Origin: *`. The `allowed_origins` field exists in the schema and database but is never read or enforced.
- **Fix:** Read `allowed_origins` from the tenant's widget config. If the request `Origin` header is in the list, reflect it back. Otherwise return a 403 or omit the header. Fallback to `*` only if `allowed_origins` is empty (backwards compat during rollout).
- **Blocked by:** Nothing.

### 1.2 Sanitize URL params in widget embed pages

- **Files:** `apps/web/app/widget/[slug]/page.tsx`, `apps/web/app/widget/preview/[slug]/page.tsx`
- **Problem:** URL query params (`flow`, `layout`, `region_style`, `location`) are interpolated into an HTML string via `dangerouslySetInnerHTML` with no validation.
- **Fix:** Validate each param against a whitelist of allowed values before building the attribute string. `flow` must be one of the known `WidgetMode` values, `layout` one of `WidgetLayout`, etc. Reject or strip anything else.
- **Blocked by:** Nothing.

### 1.3 Harden rate limiter IP extraction

- **File:** `apps/web/lib/rate-limit.ts`
- **Problem:** Trusts `x-forwarded-for` from the client. Falls back to shared `'unknown'` key.
- **Fix:** When deployed behind Vercel/Cloudflare, use the platform's verified IP header (e.g., `x-vercel-forwarded-for`). Remove the `'unknown'` fallback — if no IP can be determined, skip rate limiting or use a stricter default.
- **Blocked by:** Knowing the deployment platform.

### 1.4 Replace regex CSS sanitization

- **File:** `apps/web/lib/sanitize-css.ts`
- **Problem:** Regex-based stripping misses `calc()`, `attr()`, `var()` injection, `@supports`, and other vectors.
- **Fix:** Replace with a proper CSS parser (e.g., `postcss` — already a transitive dependency via Tailwind). Parse the CSS, walk the AST, and allowlist safe properties/values.
- **Blocked by:** Nothing.

---

## Phase 2 — DRY Extractions (High Impact)

These reduce ~400+ lines of duplication and make future changes safer.

### 2.1 Extract `useUserTenant()` hook

- **New file:** `apps/web/hooks/use-user-tenant.ts`
- **Removes duplication from:** `branding`, `layout`, `form`, `success-flow`, `integration`, `flow`, `embed`, `locations`, `settings` (9 files)
- **Interface:**
  ```typescript
  function useUserTenant(): {
    tenantId: string | null;
    userId: string | null;
    supabase: SupabaseClient;
    loading: boolean;
    error: Error | null;
  }
  ```
- **Lines saved:** ~120
- **Blocked by:** Nothing.

### 2.2 Extract `<SaveButton />` component

- **New file:** `apps/web/components/ui/save-button.tsx`
- **Removes duplication from:** `branding`, `services`, `layout`, `success-flow`, `integration`, `flow`, `locations`, `settings` (8 files)
- **Interface:**
  ```typescript
  interface SaveButtonProps {
    onSave: () => Promise<void>;
    disabled?: boolean;
    className?: string;
  }
  ```
  Internally manages `saving` / `saved` state and the 2-second timeout.
- **Lines saved:** ~90
- **Blocked by:** Nothing.

### 2.3 Extract `<PageHeader />` component

- **New file:** `apps/web/components/dashboard/page-header.tsx`
- **Removes duplication from:** 12+ pages
- **Interface:**
  ```typescript
  interface PageHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode; // right-side action slot
  }
  ```
- **Lines saved:** ~60
- **Blocked by:** Nothing.

### 2.4 Extract `<LoadingSpinner />` component

- **New file:** `apps/web/components/ui/loading-spinner.tsx`
- **Removes duplication from:** 11 pages
- **Lines saved:** ~55
- **Blocked by:** Nothing.

### 2.5 Extract `<EmptyState />` component

- **New file:** `apps/web/components/ui/empty-state.tsx`
- **Removes duplication from:** `dashboard`, `analytics`, `submissions`, `locations`, `team` (5+ files)
- **Interface:**
  ```typescript
  interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
  }
  ```
- **Lines saved:** ~50
- **Blocked by:** Nothing.

### 2.6 Extract badge color constants

- **New file:** `apps/web/lib/constants/badge-styles.ts`
- **Removes duplication from:** `dashboard/page.tsx`, `submissions-table.tsx`, `settings/page.tsx`, `team/page.tsx`, `tenants/page.tsx`, `defaults/page.tsx`
- **Constants:** `STATUS_STYLES`, `PLAN_STYLES`, `ROLE_STYLES`, `GENDER_STYLES`, `BODY_AREA_STYLES`
- **Lines saved:** ~40
- **Blocked by:** Nothing.

---

## Phase 3 — Error Handling

### 3.1 Add mutation error handling to all client pages

- **Files:** `branding`, `layout`, `success-flow`, `flow`, `form`, `locations`, `settings`, `integration`, `services`
- **Problem:** `.update()`, `.insert()`, `.delete()` return values are ignored. Users see "Saved" even when the operation failed.
- **Fix:** Check the `error` field on every mutation result. On failure, show a toast via `sonner` (already installed and configured in the root layout). Consider extracting a helper:
  ```typescript
  async function mutate(query: Promise<{ error: any }>, successMsg?: string) {
    const { error } = await query;
    if (error) { toast.error(error.message); throw error; }
    if (successMsg) toast.success(successMsg);
  }
  ```
- **Blocked by:** 2.2 (SaveButton should integrate with error state).

### 3.2 Add error logging to API catch blocks

- **Files:** `lib/auth/middleware.ts`, `app/api/widget/submit/route.ts`
- **Problem:** Bare `catch {}` blocks swallow errors with no logging. Debugging production issues is impossible.
- **Fix:** Log the error with context (route, tenant_id if available, timestamp). Structured logging preferred if a logging service is in place.
- **Blocked by:** Nothing.

### 3.3 Handle Supabase query errors in server pages

- **Files:** `dashboard/page.tsx`, `analytics/page.tsx`, `submissions/page.tsx`, `team/page.tsx`, admin pages
- **Problem:** All do `const { data } = await supabase...` and then `data ?? []`, silently rendering empty on errors.
- **Fix:** Check `error` and either throw (to trigger Next.js error boundary) or render an inline error state.
- **Blocked by:** Nothing.

---

## Phase 4 — Type Safety

### 4.1 Sync `FormFieldType` between validator and shared types

- **Files:** `apps/web/lib/validators/index.ts`, `packages/shared/src/types/index.ts`
- **Problem:** The Zod schema is missing `'date'` and `'location'` that exist in the TypeScript type. Submissions with those field types would fail validation.
- **Fix:** Add the missing values to the Zod enum. Derive the TypeScript type from the Zod schema (`z.infer`) to keep them permanently in sync.
- **Blocked by:** Nothing.

### 4.2 Replace `as` type assertions with proper typing

- **Files:** `services/page.tsx`, `form/page.tsx`, `embed/page.tsx`, `api/widget/config/route.ts`
- **Problem:** Heavy use of `as Record<string, unknown>` and similar casts that hide type errors instead of fixing them.
- **Fix:** Define proper interfaces for Supabase join results (e.g., `ServiceWithCategory`, `ProfileWithTenant`). Use `.returns<T>()` on Supabase queries where possible.
- **Blocked by:** Nothing.

---

## Phase 5 — Architecture Improvements

### 5.1 Create a data access layer

- **New directory:** `apps/web/lib/queries/`
- **Files to create:**
  - `submissions.ts` — `getSubmissions()`, `getSubmissionStats()`
  - `widget-config.ts` — `getWidgetConfig()`, `updateWidgetConfig()`
  - `regions.ts` — `getRegions()`, `getConcerns()`
  - `services.ts` — `getServices()`, `getCategories()`
  - `team.ts` — `getTeamMembers()`
  - `locations.ts` — `getLocations()`, `saveLocations()`
- **Problem:** 15+ pages write raw Supabase queries inline. Schema changes require editing every file.
- **Lines saved:** ~200+
- **Blocked by:** 2.1 (hook provides the supabase client these functions need).

### 5.2 Migrate eligible client pages to server components

- **Candidates:** `branding`, `layout`, `flow`, `embed`, `settings`
- **Problem:** These pages use `'use client'` only because they need to fetch data on mount, but they could use server-side data fetching for initial load and client components only for interactive sections.
- **Fix:** Split into server page (data fetching) + client form component (interactivity). Pass data as props.
- **Blocked by:** 5.1 (data access layer makes this cleaner).

### 5.3 Deduplicate widget attribute builder

- **Files:** `widget/[slug]/page.tsx`, `widget/preview/[slug]/page.tsx`
- **New file:** `apps/web/lib/widget/build-attrs.ts`
- **Fix:** Extract the attribute-building logic to a shared function that validates inputs.
- **Blocked by:** 1.2 (validation logic lives here).

### 5.4 Fix `Date.now()` cache busting on widget.js

- **Files:** `widget/[slug]/page.tsx`, `widget/preview/[slug]/page.tsx`
- **Problem:** `<Script src={`/widget.js?v=${Date.now()}`} />` defeats browser caching entirely.
- **Fix:** Use a build-time content hash or the package version from `package.json`.
- **Blocked by:** Nothing.

### 5.5 Fix rate limiter memory leak

- **File:** `apps/web/lib/rate-limit.ts`
- **Problem:** Cleanup only runs if 60s has elapsed since last cleanup, checked per-request. Under sustained traffic, expired entries accumulate.
- **Fix:** Use `setInterval` for cleanup, or switch to a `Map` with TTL-based eviction (e.g., `lru-cache` or a simple `setTimeout` per entry).
- **Blocked by:** Nothing.

### 5.6 Deduplicate CORS OPTIONS handlers

- **Files:** `api/widget/config/route.ts`, `api/widget/submit/route.ts`
- **Fix:** Extract a shared `corsOptionsHandler(allowedMethods: string[])` utility, or handle CORS in Next.js middleware.
- **Blocked by:** 1.1 (CORS enforcement should happen first).

---

## Implementation Order

```
Phase 1 (Security) ──────────────────────────────────── Week 1
  1.1 CORS enforcement
  1.2 URL param sanitization
  1.3 Rate limiter hardening
  1.4 CSS sanitization

Phase 2 (DRY Extractions) ──────────────────────────── Week 2
  2.1 useUserTenant() hook
  2.2 SaveButton component
  2.3 PageHeader component
  2.4 LoadingSpinner component
  2.5 EmptyState component
  2.6 Badge color constants

Phase 3 (Error Handling) ────────────────────────────── Week 2-3
  3.1 Mutation error handling + toasts
  3.2 API catch block logging
  3.3 Server page query error handling

Phase 4 (Type Safety) ──────────────────────────────── Week 3
  4.1 FormFieldType sync
  4.2 Replace type assertions

Phase 5 (Architecture) ─────────────────────────────── Week 3-4
  5.1 Data access layer
  5.2 Server component migration
  5.3 Widget attribute builder
  5.4 Cache busting fix
  5.5 Rate limiter fix
  5.6 CORS handler dedup
```

---

## Tracking

| ID  | Status | Notes |
|-----|--------|-------|
| 1.1 | [x]    | `getCorsOrigin()` in `lib/cors.ts` validates against `allowed_origins` |
| 1.2 | [x]    | `buildWidgetAttrs()` validates params against whitelists |
| 1.3 | [~]    | Cleanup fixed; IP header still uses `x-forwarded-for` — accepted risk on Vercel |
| 1.4 | [~]    | Regex approach acceptable — admin-only input, low attack surface |
| 2.1 | [x]    | `hooks/use-user-tenant.ts` — adopted in 12 client pages |
| 2.2 | [x]    | `components/ui/save-button.tsx` — adopted in 8 pages |
| 2.3 | [x]    | `components/dashboard/page-header.tsx` — adopted in 12+ pages |
| 2.4 | [x]    | `components/ui/loading-spinner.tsx` — adopted in 12 pages |
| 2.5 | [x]    | `components/ui/empty-state.tsx` — adopted in 5 pages |
| 2.6 | [x]    | `lib/constants/badge-styles.ts` — adopted in 6 pages |
| 3.1 | [x]    | All client mutations throw on error; SaveButton shows toast |
| 3.2 | [x]    | `withAuth` and `widget/submit` catch blocks now log errors |
| 3.3 | [x]    | Server pages log query errors (submissions, team, tenants, audit-log) |
| 4.1 | [x]    | Added `date` and `location` to Zod enum; added sync comment to shared type |
| 4.2 | [x]    | Cleaned up join casts in locations + form pages; `as unknown as` kept for Supabase FK join limitation |
| 5.1 | [x]    | `lib/queries/widget-config.ts` + `lib/queries/services.ts` — adopted in 7 pages |
| 5.2 | [ ]    | Deferred — server component migration requires per-page testing |
| 5.3 | [x]    | `lib/widget/build-attrs.ts` — validates params against whitelists, adopted in 2 pages |
| 5.4 | [x]    | Removed `Date.now()` cache buster; relies on `next.config.ts` Cache-Control headers |
| 5.5 | [x]    | Rate limiter uses `setInterval` for cleanup instead of per-request check |
| 5.6 | [x]    | `handleCorsOptions()` in `lib/cors.ts` — adopted in both widget API routes |
