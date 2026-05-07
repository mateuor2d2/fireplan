---
phase: 12-testing-monitoring
plan: 01
subsystem: payments, invoices, api
tags: stripe, invoices, pdf-download, rest-api

# Dependency graph
requires:
  - phase: 07-02
    provides: Invoice model (IInvoice, stripeInvoiceId, userId/planId indexes)
  - phase: 10-02
    provides: Stripe Checkout session creation with payment tracking
provides:
  - Invoice PDF download endpoint using Stripe-hosted URLs
  - IInvoice TypeScript interface with hosted_invoice_url field
  - Authorization-protected invoice access (users can only download their own invoices)
affects: [payment-history-ui, invoice-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Stripe invoice retrieve with expand option for hosted URLs
    - sendRedirect from h3 for external URL redirects
    - Ownership-based authorization via userId check in database query
    - Optional type field for Stripe-populated data (hosted_invoice_url)

key-files:
  created:
    - server/api/invoices/[id]/download.get.ts
    - server/types/invoice.ts
  modified: []

key-decisions:
  - "Redirect to Stripe-hosted PDF URLs instead of generating custom PDFs"
  - "TypeScript interface created separately from Mongoose model (following project pattern)"
  - "Authorization via database query filter (userId + _id) instead of separate ownership check"
  - "Spanish error messages for consistency with existing codebase"

patterns-established:
  - "Invoice Download Pattern: GET /api/invoices/[id]/download → Stripe invoice retrieve → redirect to hosted_invoice_url"
  - "Authorization Pattern: findOne with { _id, userId } ensures users can only access their own data"
  - "Error Handling: createError with Spanish statusMessage and proper status codes"

# Metrics
duration: 8min
completed: 2026-02-14
---

# Phase 12: Testing & Monitoring - Plan 01 Summary

**Invoice PDF download endpoint using Stripe-hosted invoice URLs**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-02-14T14:47:28Z
- **Completed:** 2026-02-14T14:56:01Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created invoice PDF download endpoint at `/api/invoices/[id]/download`
- Endpoint redirects to Stripe-hosted invoice PDF URLs
- Authorization ensures users can only download their own invoices
- Created IInvoice TypeScript interface with hosted_invoice_url field
- Spanish error messages throughout for consistency

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invoice download endpoint** - `8105899` (feat)
2. **Task 2: Create Invoice interface** - `3b12c95` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `server/api/invoices/[id]/download.get.ts` - GET endpoint that redirects to Stripe-hosted invoice PDF
- `server/types/invoice.ts` - TypeScript interface for Invoice model with hosted_invoice_url field

## Implementation Details

### Invoice Download Endpoint (`server/api/invoices/[id]/download.get.ts`)

1. **Authentication:** Validates `event.context.user` exists (returns 401 if not authenticated)
2. **Route parameter extraction:** Gets invoice ID from `getRouterParam(event, 'id')`
3. **Database query with ownership check:**
   - `Invoice.findOne({ _id: invoiceId, userId: user._id })`
   - Returns 404 if invoice not found or doesn't belong to user
4. **Stripe invoice retrieval:**
   - `stripe.invoices.retrieve(invoice.stripeInvoiceId, { expand: ['hosted_invoice_url'] })`
   - Fetches invoice with hosted PDF URL expanded
5. **Validation:** Checks `hosted_invoice_url` exists (returns 400 if missing)
6. **Redirect:** Returns `sendRedirect(event, stripeInvoice.hosted_invoice_url)` for 302 redirect

### Invoice Type Interface (`server/types/invoice.ts`)

- Defines `IInvoice` interface matching Invoice model schema
- Includes optional `hosted_invoice_url?: string` field
- Field is populated when retrieving invoices from Stripe with expand option
- Follows project pattern of separating types from Mongoose models

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed as planned.

## User Setup Required

None - this is a backend API endpoint that uses existing Stripe configuration.

## Verification Criteria

1. ✅ Created endpoint at `server/api/invoices/[id]/download.get.ts`
2. ✅ Endpoint validates user owns invoice (userId check in database query)
3. ✅ Endpoint retrieves Stripe invoice with hosted_invoice_url (using expand option)
4. ✅ Endpoint redirects to Stripe-hosted PDF URL (via sendRedirect)
5. ✅ IInvoice interface created with hosted_invoice_url field

## Success Criteria

1. ✅ Users can download invoice PDFs via `/api/invoices/[id]/download`
2. ✅ Download endpoint redirects to Stripe-hosted PDF URL
3. ✅ Users can only download their own invoices (authorization check via database query)
4. ✅ Missing hosted_invoice_url returns appropriate error (400 status code)

## Next Phase Readiness

- Invoice download endpoint ready for integration with payment history UI
- IInvoice interface provides type safety for future invoice-related features
- Authorization pattern established for user-specific resource access

**Blockers:** None - feature is complete and ready for frontend integration.

---
*Phase: 12-testing-monitoring*
*Plan: 01*
*Completed: 2026-02-14*
