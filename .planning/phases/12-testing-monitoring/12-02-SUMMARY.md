---
phase: 12-testing-monitoring
plan: 02
subsystem: payments
tags: [mailgun, email, notifications, stripe, payment-failure, i18n-spanish]

# Dependency graph
requires:
  - phase: 08-webhook-infrastructure
    provides: webhook event handlers, Mailgun configuration
provides:
  - Payment failure email notification utility via Mailgun
  - Reusable sendPaymentFailureEmail function for webhook handlers
  - Spanish email template with invoice URL and grace period notice
affects: [webhook-handlers, payment-workflow, dunning-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mailgun email notification pattern
    - Spanish language email templates for user-facing communications
    - Payment failure dunning communication

key-files:
  modified:
    - server/utils/email.ts - Added sendPaymentFailureEmail function

key-decisions:
  - "Spanish language for email content - matches app locale"
  - "Grace period notice to reduce user anxiety during payment retries"
  - "Invoice URL button for direct payment method updates"
  - "Reuse existing Mailgun client pattern from sendResetEmail"

patterns-established:
  - "Email notification pattern: Mailgun client → HTML template → error handling"
  - "Spanish user-facing communications for consistency"
  - "Grace period messaging to prevent premature account access concerns"

# Metrics
duration: 5min
completed: 2026-02-14
---

# Phase 12 Plan 02: Payment Failure Email Notification Summary

**Payment failure email notification utility using Mailgun with Spanish template, invoice URL button, and grace period notice**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-14T14:47:40Z
- **Completed:** 2026-02-14T14:52:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `sendPaymentFailureEmail` function to `server/utils/email.ts`
- Spanish email template with invoice URL button for easy payment method updates
- Grace period notice (7 days) informs users access continues during Stripe Smart Retries
- Retry count display and support contact information
- Comprehensive error handling with detailed Mailgun error logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Add payment failure email function** - `9eeaedc` (feat)

**Plan metadata:** (to be created at phase completion)

_Note: Single task plan with one commit_

## Files Created/Modified

- `server/utils/email.ts` - Added `sendPaymentFailureEmail` function with Mailgun integration

## Decisions Made

- Spanish language for email content - matches app locale and user expectations
- Grace period notice (7 days) to reduce user anxiety during payment retries
- Invoice URL button for direct Stripe-hosted payment method updates
- Reuse existing Mailgun client pattern from `sendResetEmail` for consistency
- Red color (#dc2626) for failure heading to draw attention
- Orange border (#ffa500) for important grace period information

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward with existing Mailgun infrastructure.

## User Setup Required

None - uses existing Mailgun configuration from environment variables.

## Verification Criteria Met

1. ✅ Payment failure email function exists and is reusable
2. ✅ Email template includes actionable invoice URL button
3. ✅ Email informs users of grace period (7 days)
4. ✅ Function follows same pattern as existing sendResetEmail

## Next Phase Readiness

- Payment failure email utility ready for integration in webhook event handlers
- Ready to be called from `handleInvoicePaymentFailed` in `server/utils/webhookHandlers.ts`
- No blockers or concerns

---
*Phase: 12-testing-monitoring*
*Plan: 02*
*Completed: 2026-02-14*
