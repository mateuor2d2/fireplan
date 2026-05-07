# Phase 9: Access Control & Security - Context (UPDATED: Pay-to-Print Model)

**Goal**: Enforce payment requirement before PDF generation/printing while allowing free plan creation.

## Overview

Phase 9 implements the **pay-to-print** flow. Users can create and fill out plans for free, but must pay before generating PDFs. This is a change from the original "pay-to-create" model - users can explore the full form before committing to payment.

## Requirements Coverage

| Requirement | Plan | Description |
|-------------|------|-------------|
| PAY-01 | 09-01 | System blocks PDF generation until successful payment |
| PAY-02 | 09-02 | User can create plans free, pays to print |
| PAY-02a | N/A | Plan creation form accessible without payment (default Nuxt behavior) |
| PAY-02b | 09-02 | Print button triggers payment if no payment exists |
| SUB-04 | 09-02 | Subscription access enforced at API/route level |
| SEC-03 | 09-03 | CSP headers whitelist Stripe domains |
| SEC-04 | 09-03 | HTTPS only in production |
| SEC-05 | N/A | Webhook signature verification (Phase 8 complete) |

## Key Decision: Pay-to-Print Model

**Decision**: Users can create and fill plans for free, payment required only for PDF generation

**Rationale**:
- Lower barrier to entry - users see full value before paying
- Better conversion - users invest time in filling form, more likely to pay
- Flexible exploration - no payment until ready to print

**Implementation**:
1. Plan creation form (`/protected/planes/obra`) - NO payment check
2. PDF generation endpoint (`/api/planes/[id]/generate-pdf`) - PAYMENT CHECK
3. Print button in UI - Triggers payment flow if no payment exists

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 9 ARCHITECTURE (Pay-to-Print)             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  WAVE 1: PDF Generation Payment Enforcement                              │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ server/api/planes/[id]/generate-pdf.get.ts                          │ │
│  │   - Check Payment.status === 'succeeded' before generating PDF     │ │
│  │   - Return 403 + payment URL if no payment                          │ │
│  │   - Allow PDF generation if payment exists                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  WAVE 2: Print Button Payment Trigger & Subscription Enforcement          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ app/composables/usePaymentGuard.ts                                  │ │
│  │   - Check payment status before allowing print                      │ │
│  │   - Trigger payment flow if no payment exists                       │ │
│  │   - Return user to print after payment                             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ server/api/planes/[id]/issues.post.ts                                │ │
│  │   - Check Subscription.status === 'active' for issue reporting     │ │
│  │   - Return 403 if no active subscription                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  WAVE 3: Security Headers & CSP Configuration                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ nuxt.config.ts                                                       │ │
│  │   - Add js.stripe.com to scriptSrc                                  │ │
│  │   - Add checkout.stripe.com to frameSrc                             │ │
│  │   - Add https://checkout.stripe.com to formSrc                      │ │
│  │   - Verify x-frame-options SAMEORIGIN                                │ │
│  │   - Verify strict-transport-security in production                  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## What Changed from Original Plan

| Aspect | Original (Pay-to-Create) | New (Pay-to-Print) |
|--------|-------------------------|-------------------|
| Enforcement point | `/protected/planes/obra` entry | `/api/planes/[id]/generate-pdf` |
| User can create plan? | ❌ No (requires payment) | ✅ Yes (free) |
| User can fill form? | ❌ No (requires payment) | ✅ Yes (free) |
| User can print? | ✅ Yes (already paid) | ❌ No (requires payment) |
| Payment trigger | Before form access | At print button |

## Dependencies

- **Phase 7**: Payment and Subscription models must exist
- **Phase 8**: Webhook handlers must update Payment.status to 'succeeded'

## Files to Create

1. `app/composables/usePaymentGuard.ts` - Reusable payment guard for print button
2. No server middleware needed (enforcement in API endpoint)

## Files to Modify

1. `server/api/planes/[id]/generate-pdf.get.ts` - Add payment check
2. `server/api/planes/[id]/issues.post.ts` - Add subscription check
3. `nuxt.config.ts` - CSP headers for Stripe domains

## Files NOT Needed (from original plan)

1. ~~`server/middleware/paymentEnforcement.ts`~~ - Not needed, no middleware
2. ~~`app/middleware/paymentRequired.ts`~~ - Not needed, form is open

## Success Criteria Verification

| Criterion | Verification Method |
|-----------|---------------------|
| 1. Users can create plans without payment | Try POST /api/planes without payment → 201 Created |
| 2. Users can access plan form without payment | Try /protected/planes/obra without payment → Page loads |
| 3. PDF generation requires payment | Try GET /api/planes/[id]/generate-pdf without payment → 403 |
| 4. CSP headers whitelist Stripe domains | Check response headers → Content-Security-Policy includes Stripe |
| 5. QR issue access requires active subscription | Try POST /api/planes/[id]/issues without subscription → 403 |

## User Flow

```
1. User clicks "New Plan"
   └─► Goes to /protected/planes/obra (FREE - no payment check)

2. User fills out plan form (obra, plan, contratista, promotor)
   └─► Saves to database (plan created with canPrint = false)

3. User clicks "Print/Generate PDF" button
   ├─► Check: Does payment exist?
   │   ├─► YES → Generate PDF
   │   └─► NO → Redirect to payment flow
   │       └─► Stripe Checkout
   │           └─► Payment webhook → Payment.status = 'succeeded'
   │               └─► Return to plan → Generate PDF
```

## Edge Cases

1. **Payment pending**: Show "Payment processing" badge, disable print
2. **Payment failed**: Show payment failure message, retry option
3. **Subscription past_due**: Allow issue creation (grace period)
4. **Subscription canceled**: Deny new issues immediately
5. **Admin users**: Whitelist admin role from payment enforcement (optional)

## Testing Notes

- Use Stripe Test Mode for payment flow testing
- Test free plan creation (no payment required)
- Test payment trigger at print time
- Verify pending → succeeded webhook transition
- Verify PDF generation after payment

---

*Context updated: 2026-01-26*
*Model changed: Pay-to-Create → Pay-to-Print*
*Ready for planning update*
