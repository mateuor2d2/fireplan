---
status: verifying
trigger: "Query MongoDB to check the actual issueQrCode data for the plan with slug '1c742c46'"
created: 2026-01-23T12:00:00.000Z
updated: 2026-01-23T12:35:00.000Z
---

## Current Focus

hypothesis: FIX APPLIED - Added /public route exclusion to auth middleware
test: Test public route access after middleware fix
expecting: /public/* routes should be accessible without authentication
next_action: Restart dev server to clear middleware cache and test

## Symptoms

expected: QR code URL should work and validate access token
actual: "Token de acceso inválido" error when accessing the URL
errors: "Token de acceso inválido" (403 Forbidden)
reproduction: Access http://localhost:3001/public/issues/1c742c46/8c18d08b-0609-49b2-955e-77b75b1bcd38
started: Recently after QR code feature implementation

## Evidence

- timestamp: 2026-01-23T12:00:00.000Z
  checked: MongoDB query for plan with issueQrCode.slug = '1c742c46'
  found: Plan exists with slug '1c742c46' and accessToken '8c18d08b-0609-49b2-955e-77b75b1bcd38'
  implication: Database values are correct and match the URL

- timestamp: 2026-01-23T12:00:00.000Z
  checked: Client-side page at /app/pages/public/issues/[qrSlug]/[code].vue
  found: Page expects URL format: /public/issues/${qrSlug}/${code}
  implication: Generated URL format is CORRECT for client-side page

- timestamp: 2026-01-23T12:25:00.000Z
  checked: Validation API at /server/api/public/issue-report/validate-by-slug.post.ts
  found: API accepts slug and accessToken in POST body
  implication: Page makes POST request to validate, not using URL params directly

- timestamp: 2026-01-23T12:28:00.000Z
  checked: Auth middleware at /app/middleware/auth.ts
  found: Middleware blocks ALL routes except /login, /signup, /reset-password
  implication: /public/* routes are being blocked by auth middleware!

- timestamp: 2026-01-23T12:29:00.000Z
  checked: Tested URL with curl
  found: Server redirects to login page instead of allowing access
  implication: Auth middleware is intercepting public routes

- timestamp: 2026-01-23T12:32:00.000Z
  checked: Applied fix to auth middleware
  found: Added check: if (to.path.startsWith('/public')) return
  implication: Public routes should now bypass authentication

- timestamp: 2026-01-23T12:34:00.000Z
  checked: Tested URL with curl after fix
  found: Still redirects to login (middleware cache issue)
  implication: Nuxt middleware cache needs to be cleared

## Resolution

root_cause: Auth middleware is not excluding /public routes

**Problem:**
- Auth middleware (/app/middleware/auth.ts) blocks ALL routes
- Only explicitly excludes /login, /signup, /reset-password
- Does NOT exclude /public/* routes

**Fix applied:**
Added /public route exclusion to auth middleware (line 7-10)

files_changed:
- /home/mateu/NuxtsProjects/v9PLANESN4BUI4/app/middleware/auth.ts

verification: In progress - need to restart dev server to clear cache

## Eliminated

- hypothesis: Database has wrong accessToken
  evidence: MongoDB query confirmed accessToken matches URL exactly
  timestamp: 2026-01-23T12:00:00.000Z

- hypothesis: URL structure is wrong
  evidence: Client-side page exists at /public/issues/[qrSlug]/[code].vue matching generated URL format
  timestamp: 2026-01-23T12:25:00.000Z

- hypothesis: Validation API is wrong
  evidence: Validation API correctly handles slug + accessToken in POST body
  timestamp: 2026-01-23T12:28:00.000Z
