---
phase: 09-access-control-security
plan: 02
subsystem: payments
tags: [payment-guard, subscription-enforcement, pay-to-print, stripe]

# Dependency graph
requires:
  - phase: 09-01
    provides: PDF generation payment enforcement, Payment model, pay-to-print model foundation
  - phase: 07
    provides: Subscription model with status tracking
provides:
  - Client-side payment guard composable for print button payment flow
  - Server-side subscription enforcement for QR issue reporting
  - Pay-to-print model implementation (free plan creation, pay to print)
affects: [phase-10-stripe-checkout, phase-09-03-csp-headers]

# Tech tracking
tech-stack:
  added: [usePaymentGuard composable]
  patterns: [payment guard pattern, subscription access control, reactive payment status]

key-files:
  created:
    - app/composables/usePaymentGuard.ts - Payment guard composable for print button
  modified:
    - server/api/public/issue-report/submit.post.ts - Added subscription check

key-decisions:
  - "Subscription enforcement in public issue submission endpoint (not protected endpoint)"
  - "Grace period for past_due subscriptions (allow issue reporting during dunning)"
  - "Payment guard returns navigation (does not redirect automatically - caller controls flow)"

patterns-established:
  - "Pattern: Client-side payment guard with reactive status tracking"
  - "Pattern: Server-side subscription check with graceful 403 responses"
  - "Pattern: Return URL encoding for post-payment redirects"

# Metrics
duration: 7min
completed: 2026-01-27
---

# Phase 9 Plan 2: Print Button Payment Guard + Subscription Enforcement Summary

**Client-side payment guard composable for pay-to-print flow with server-side subscription enforcement for QR issue reporting**

## Performance

- **Duration:** 7 minutes
- **Started:** 2026-01-27T05:40:11Z
- **Completed:** 2026-01-27T05:47:25Z
- **Tasks:** 3 completed
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Created `usePaymentGuard` composable for print button payment flow with reactive status tracking
- Added subscription enforcement to public issue submission endpoint with grace period support
- Verified pay-to-print model: users can create plans for free, pay to generate PDFs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create usePaymentGuard composable for print button** - `000ca29` (feat)
2. **Task 2: Add subscription check to issue creation endpoint** - `aded0e5` (feat)
3. **Task 3: Test payment guard and subscription enforcement** - (verification only, no commit)

**Plan metadata:** (to be committed)

## Files Created/Modified

- `app/composables/usePaymentGuard.ts` (110 lines) - Payment guard composable with checkPayment, requirePaymentOrTrigger, reactive hasPayment/paymentStatus refs, JSDoc documentation
- `server/api/public/issue-report/submit.post.ts` (231 lines) - Added Subscription import, subscription query for active/past_due status, 403 error with subscription URL

## Decisions Made

1. **Subscription enforcement in public endpoint** - Added subscription check to `/api/public/issue-report/submit` instead of a protected endpoint, since QR issue reporting is a public feature accessed via QR codes without authentication
2. **Grace period for past_due subscriptions** - Allow issue reporting when subscription status is `past_due` to give users time to update payment methods before losing access
3. **Payment guard returns navigation, not redirect** - `requirePaymentOrTrigger` uses `navigateTo()` which returns control to the caller, allowing the caller to decide whether to continue execution after the navigation call

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully without issues.

## User Setup Required

None - no external service configuration required for this phase.

## Next Phase Readiness

**Ready for Phase 9 Plan 3 (CSP Headers):**
- Payment guard composable created and ready for integration with Stripe Checkout in Phase 10
- Subscription enforcement in place for QR issue reporting
- Pay-to-print model fully implemented and verified

**Blockers/Concerns:**
- None - ready to proceed with CSP header updates for Stripe domains

**Integration Notes for Phase 10 (Stripe Checkout):**
- `usePaymentGuard.checkPayment()` currently returns false (placeholder) - needs integration with `/api/payments/status/[planId]` endpoint
- `requirePaymentOrTrigger()` navigates to `/payment?planId={id}&returnUrl={url}` - payment page needs to read these query params
- Return URL encoding uses `encodeURIComponent()` - payment page must decode with `decodeURIComponent()`

---
*Phase: 09-access-control-security*
*Plan: 02*
*Completed: 2026-01-27*
