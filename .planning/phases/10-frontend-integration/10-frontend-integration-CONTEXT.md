# Phase 10: Frontend Integration - Context

**Phase:** 10 of 12 (Frontend Integration)
**Milestone:** v1.1 Stripe Payments
**Created:** 2026-01-27
**Status:** Planning

## Overview

Phase 10 builds the user-facing payment UI that connects to the backend payment infrastructure created in Phases 7-9. Users will see a polished Stripe Checkout flow when they need to pay for plan printing, with clear visual status indicators throughout.

## What We're Building

### The Payment Flow

```
1. User clicks "Print" button on a plan
   ↓
2. usePaymentGuard.checkPayment() checks if payment exists
   ↓
3a. No payment → Navigate to /payment page
   ↓
4. Payment page creates Stripe Checkout session
   ↓
5. Redirect to hosted Stripe Checkout (card entry)
   ↓
6. User completes payment
   ↓
7. Stripe redirects back to print page (?payment=success)
   ↓
8. Print page detects success, updates UI, enables PDF generation

3b. Has payment → Print directly (existing behavior)
```

### Key Components

1. **Payment Status API** - Server endpoint to check payment status
2. **Checkout Creation API** - Server endpoint to create Stripe Checkout sessions
3. **Payment Page** - Client page that initiates checkout flow
4. **Payment Status Badge** - Visual indicator showing payment state
5. **Enhanced usePaymentGuard** - Real API integration (replaces placeholders)
6. **Return URL Handler** - Post-payment flow and success confirmation

## Requirements Mapping

| Requirement | Plan | Description |
|-------------|------|-------------|
| PAY-03 | 10-02, 10-04 | Embedded Stripe Checkout for payment |
| PAY-04 | 10-02 | Checkout includes plan metadata |
| PAY-05 | 10-06 | Success URL redirects back to print page |
| STAT-03 | 10-03 | Visual status badges (Paid, Pending, Failed) |

## Technical Context

### Existing Code to Leverage

1. **usePaymentGuard Composable** (`app/composables/usePaymentGuard.ts`)
   - Created in Phase 9 with placeholder `checkPayment()`
   - Has TODO comments for Phase 10 API integration
   - `requirePaymentOrTrigger()` navigates to `/payment` (needs to exist)
   - Already has reactive refs: `hasPayment`, `paymentStatus`

2. **Payment Model** (`server/models/Payment.ts`)
   - Status enum: 'pending', 'succeeded', 'failed', 'canceled'
   - Fields: userId, planId, stripePaymentIntentId, amount, status
   - Indexes for efficient queries

3. **QRStatusBadge Pattern** (`app/components/qr/QRStatusBadge.vue`)
   - Perfect template for PaymentStatusBadge
   - Uses UBadge with computed color, label, icon
   - Props: state, size, variant

4. **CSP Headers** (Phase 9 complete)
   - `js.stripe.com` whitelisted in scriptSrc
   - `checkout.stripe.com` whitelisted in frameSrc and formSrc
   - Ready for Stripe.js loading and iframe checkout

### Stripe Checkout Integration

**Why Stripe Checkout (not Stripe Elements)?**
- PCI DSS SAQ A compliance (simpler security)
- Hosted payment page (no card data touches our servers)
- Mobile-optimized UI
- Built-in error handling
- Faster implementation

**Checkout Session Structure:**
```typescript
{
  mode: 'payment',  // One-time payment (not subscription)
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: {
        name: 'Plan de Seguridad: [plan name]',
        description: 'Generación de PDF de Plan de Seguridad'
      },
      unit_amount: 2900  // €29.00 in cents
    },
    quantity: 1
  }],
  success_url: `${SITE_URL}/protected/planes/${planId}/print?payment=success`,
  cancel_url: returnUrl || `${SITE_URL}/protected/planes/${planId}`,
  metadata: {
    userId,
    planId,
    planName
  }
}
```

## Decisions from Previous Phases

### Pay-to-Print Model (Phase 9)
- Users create plans for free
- Payment required only for PDF generation
- No payment check on plan creation or editing
- Print button triggers payment flow if needed

### Subscription Enforcement (Phase 9)
- QR issue access requires `active` or `past_due` subscription
- Grace period for `past_due` status
- Server-side check in issue submission endpoint

### Security (Phase 9)
- CSP headers whitelist Stripe domains
- HTTPS-only in production
- No raw card data storage

## File Structure

```
server/api/payments/
  status/[planId].get.ts          NEW (10-01)
  create-checkout.post.ts          NEW (10-02)

app/components/payment/
  PaymentStatusBadge.vue           NEW (10-03)

app/pages/protected/
  payment/index.vue                 NEW (10-04)

app/composables/
  usePaymentGuard.ts               MODIFY (10-05)

app/pages/protected/planes/[id]/
  print.vue                        MODIFY (10-06)
```

## Wave Breakdown

**Wave 1: API Layer** (Server-side foundation)
- 10-01: Payment status endpoint (GET /api/payments/status/[planId])
- 10-02: Stripe Checkout session creation (POST /api/payments/create-checkout)

**Wave 2: UI Components** (Client-side presentation)
- 10-03: PaymentStatusBadge component
- 10-04: Payment page with Stripe Checkout redirection

**Wave 3: Integration** (Connecting frontend to backend)
- 10-05: Enhanced usePaymentGuard with real API calls
- 10-06: Return URL handling and post-payment flow

## Success Criteria

From ROADMAP.md - what must be TRUE after Phase 10:

1. ✅ Users see Stripe Checkout for payment initiation
2. ✅ Payment status displays with visual badges (✅ Paid, ⏳ Pending, ❌ Failed)
3. ✅ Successful payment redirects to plan page to trigger PDF generation
4. ✅ Checkout includes plan metadata (user, plan name)

## Verification Plan

After all plans complete, test the full flow:

1. **Unpaid Plan Flow:**
   - Navigate to a plan without payment
   - Click "Print" button
   - Verify: Redirects to /payment page
   - Verify: Payment page creates checkout session
   - Verify: Redirects to Stripe Checkout
   - Complete test payment
   - Verify: Redirects back to print page with ?payment=success
   - Verify: Print page shows "Pagado" badge
   - Verify: PDF generation works

2. **Paid Plan Flow:**
   - Navigate to a plan with succeeded payment
   - Click "Print" button
   - Verify: Goes directly to print (no payment page)
   - Verify: PDF generation works

3. **Payment Status Display:**
   - Navigate to plan list
   - Verify: Plans show correct payment badge (Paid/Pending/Failed)
   - Verify: Badge colors are correct (green/orange/red)

## Open Questions

**Pricing:**
- What is the price per plan?
- Decision: Use €29 fixed price for now (can be made configurable later)

**Payment Polling:**
- Should we poll for payment status if webhook is delayed?
- Decision: No, rely on webhooks. If user returns quickly, show "Procesando" status.

**Multiple Payments:**
- What if user tries to pay again for same plan?
- Decision: API checks for existing 'succeeded' payment before creating new checkout session.

## Dependencies

**Completed:**
- ✅ Phase 7: Payment model, subscription API, Stripe helpers
- ✅ Phase 8: Webhook infrastructure with event handlers
- ✅ Phase 9: Access control, CSP headers, usePaymentGuard placeholder

**Unblocked:**
- Phase 10 unblocks Phase 11 (Subscription Management)
- Phase 10 unblocks Phase 12 (Testing & Monitoring)

---

**Context created:** 2026-01-27
**Next step:** Create ROADMAP.md updates and 6 plan files
