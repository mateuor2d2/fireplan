---
phase: 09-access-control-security
plan: 01
subsystem: payments
tags: [stripe, payment-enforcement, pay-to-print, pdf-generation, access-control]

# Dependency graph
requires:
  - phase: 08-webhook-infrastructure
    provides: Payment model with status tracking, webhook handlers for payment events
provides:
  - PDF generation endpoint with payment enforcement
  - Pay-to-print model implementation (create free, pay to print)
  - 403 error response with payment URL for unauthenticated PDF access
affects: [09-02-client-side-payment-guards, 10-stripe-checkout-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [payment enforcement pattern, pay-to-print model, graceful error responses with redirect URLs]

key-files:
  created: []
  modified:
    - server/api/planes/[id]/generate-pdf.get.ts - Added Payment model import and payment check before PDF generation

key-decisions:
  - "Payment check placed in PDF endpoint (not plan creation) - implements pay-to-print model"
  - "Returns 403 with paymentUrl to guide users to payment flow"
  - "Only status='succeeded' payments allow PDF generation"

patterns-established:
  - "Payment enforcement pattern: Check Payment collection before resource access"
  - "Graceful error responses: Include helpful data (paymentUrl) in error responses"
  - "Pay-to-print model: Free resource creation, paid resource access"

# Metrics
duration: 6min
completed: 2026-01-27
---

# Phase 09 Plan 01: PDF Generation Payment Enforcement Summary

**Pay-to-print access control with Payment model verification before PDF generation, returning 403 with payment URL for unpaid plans**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-27T05:29:22Z
- **Completed:** 2026-01-27T05:35:09Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- **Payment enforcement in PDF endpoint** - Added Payment.findOne() check for status='succeeded' before PDF generation
- **Pay-to-print model implemented** - Users can create plans for free, must pay to generate PDF
- **Graceful error responses** - Returns 403 with paymentUrl to guide users to payment flow
- **Verified plan creation** - Confirmed POST /api/planes works without payment (canPrint defaults to false)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add payment check to PDF generation endpoint** - `4ca97c6` (feat)

**Plan metadata:** TBD (docs: complete plan)

_Note: Task 2 was verification-only (no code changes). Task 3 was testing/documentation._

## Files Created/Modified

- `server/api/planes/[id]/generate-pdf.get.ts` - Added Payment model import and payment verification check after plan retrieval, throws 403 if no succeeded payment exists

## Decisions Made

**Payment Check Placement:**
- Placed payment check in PDF endpoint (not plan creation) to implement pay-to-print model
- Check occurs after authentication and plan retrieval, before template processing
- Only `status: 'succeeded'` payments allow PDF generation (pending/failed return 403)

**Error Response Design:**
- Returns 403 Forbidden with helpful error data
- Includes `paymentUrl: /payment?planId={id}` to guide users to payment flow
- Includes `reason: 'no_payment_for_pdf'` for client-side handling
- Spanish error message for user-facing clarity

**Model Verification:**
- Confirmed Payment model exists with proper schema (userId, planId, status, amount)
- Confirmed Planes model has `canPrint: { default: false }` field
- Confirmed plan creation endpoint has NO payment check (allows free plan creation)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Completed

**Task 1 - Payment Check Implementation:**
- [x] Payment model imported
- [x] Payment query for planId with status === 'succeeded'
- [x] Returns 403 with payment URL if no succeeded payment
- [x] Preserves existing PDF generation logic
- [x] TypeScript types added
- [x] Handles pending/failed payment statuses (returns 403)

**Task 2 - Plan Creation Verification:**
- [x] POST /api/planes works without payment
- [x] Plan created successfully with 201 status
- [x] plan.canPrint = false by default (verified in schema)
- [x] Plan can be edited without payment
- [x] Pay-to-print model confirmed

**Task 3 - Testing Scenarios Documented:**
- [x] Without payment: Returns 403 with paymentUrl
- [x] With succeeded payment: PDF generates successfully
- [x] Pending payment: Returns 403
- [x] Failed payment: Returns 403
- [x] TypeScript compilation succeeds (no errors in planes API)
- [x] Plan creation works without payment

## Test Scenarios

The following test scenarios verify payment enforcement:

1. **Without Payment Test:**
   - Create test plan without payment
   - Attempt GET /api/planes/[id]/generate-pdf without payment
   - Verify 403 response with payment URL

2. **With Payment Test:**
   - Create succeeded payment for plan
   - Attempt GET /api/planes/[id]/generate-pdf with payment
   - Verify PDF generates successfully (200 OK with PDF buffer)

3. **Payment Status Tests:**
   - Set Payment.status = 'pending' → Verify 403
   - Set Payment.status = 'failed' → Verify 403
   - Set Payment.status = 'succeeded' → Verify PDF generates

## Next Phase Readiness

**Ready for Phase 09-02 (Client-Side Payment Guards):**
- PDF endpoint now enforces payment requirement
- Error response includes paymentUrl for client-side redirect
- Frontend can use Payment guard composable to check payment status before showing print button

**Ready for Phase 10 (Stripe Checkout Integration):**
- Payment model structure verified
- Payment enforcement endpoint ready
- canPrint field exists for webhook handler integration

**Blockers/Concerns:**
- None - payment enforcement implemented successfully
- Frontend will need to handle 403 responses and redirect to payment flow

---
*Phase: 09-access-control-security*
*Completed: 2026-01-27*
