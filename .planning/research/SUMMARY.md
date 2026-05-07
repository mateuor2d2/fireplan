# Research Summary - v1.1 Stripe Payments

**Project:** v9planesN3Bui3 - Construction Safety Plan Management SaaS
**Milestone:** v1.1 Stripe Payments
**Research Date:** 2026-01-25
**Overall Confidence:** HIGH

---

## Executive Summary

Comprehensive research completed across 4 dimensions (Stack, Features, Architecture, Pitfalls) for adding Stripe Checkout and per-plan subscriptions to an existing Nuxt 3/4 + MongoDB SaaS application.

**Key Finding:** The existing payment infrastructure is solid and follows 2025 best practices. The project already has `stripe` v18.5.0, `@stripe/stripe-js` v7.9.0, Payment Intent flow, webhook handling, and SSE for real-time updates. The task is to **extend** this with per-plan subscriptions, not rebuild payments from scratch.

**Primary Recommendation:** Add Stripe Checkout for subscriptions alongside existing Payment Elements. Use webhook-driven state updates with server-side payment enforcement at all access points.

---

## Dimension Summaries

### STACK.md - Stripe Integration Stack (HIGH Confidence)

**Finding:** Existing implementation is current and follows best practices. No package upgrades needed.

**Key Recommendations:**
- Use Stripe Checkout for subscriptions (not Elements) - better UX for recurring billing
- Keep existing Payment Elements for one-time pay-per-plan flow
- Add Customer Portal for self-service subscription management
- Extend webhook handlers for subscription lifecycle events

**Tech Stack:**
- `stripe` v18.5.0 ✅ (already installed)
- `@stripe/stripe-js` v7.9.0 ✅ (already installed)
- No Nuxt-specific Stripe module needed - use SDK directly

---

### FEATURES.md - Payment Flow Features (HIGH Confidence)

**Finding:** 10 table stakes features identified for v1.1. Per-plan subscription model validated.

**Table Stakes (Must-Have):**
1. Pre-payment access control (block plan creation until paid)
2. Payment status persistence & display
3. One-time payment flow (Stripe Checkout)
4. Per-plan subscription management (QR issue reporting)
5. Webhook-driven payment confirmation
6. Payment history & invoice access
7. Failed payment handling (Stripe Smart Retries)
8. Subscription pause/resume (per plan)
9. Subscription cancellation (immediate vs period end)
10. Security & compliance (PCI DSS, CSP)

**Differentiators (Deferred to v1.2+):**
- Bulk payment (pay for multiple plans)
- Annual pre-pay discounts
- Payment method management
- Usage analytics dashboard
- Multi-currency support
- Payment reminders

**Anti-Features (Deliberately NOT Building):**
- Per-user subscription tiers (our model: pay-per-plan)
- Free trial periods (pay-for-what-you-use instead)
- Annual/monthly toggle (monthly only for subscriptions)
- Tiered subscription levels (single subscription per plan)
- Usage-based billing (flat monthly fee instead)
- Prorated upgrades/downgrades (pause/resume is better)
- Self-service refunds (support ticket instead)

---

### ARCHITECTURE.md - Payment System Architecture (HIGH Confidence)

**Finding:** Webhook-driven state updates are the source of truth. Server-side payment enforcement is critical.

**Component Boundaries:**
- **Frontend:** New `payments.ts` Pinia store, payment/subscription components
- **Backend:** Subscription API endpoints, webhook handlers for subscriptions
- **Database:** New Subscription model, Plan model updates for subscription fields

**Data Flow:**
```
User → Stripe Checkout → Webhook → MongoDB → SSE → UI
```

**Access Control Enforcement Points:**
1. Plan creation flow (payment required before creation)
2. Plan detail page (show payment form if unpaid)
3. PDF generation (check payment/subscription status)
4. QR access (validate subscription before granting access)

**Build Order (12-19 days):**
1. Subscription model (1-2 days)
2. Subscription API endpoints (2-3 days)
3. Webhook handlers for subscriptions (1-2 days)
4. Update Plan model (1 day)
5. Frontend: Payments store (2-3 days)
6. Frontend: Payment components (2-3 days)
7. Access control updates (1-2 days)
8. Testing & validation (2-3 days)

---

### PITFALLS.md - Stripe Integration Pitfalls (HIGH Confidence)

**Finding:** Payment bypass is the #1 security risk. Webhook signature verification is critical.

**Critical Pitfalls (Must Address):**
1. **Payment Bypass via Client-Side Manipulation** - Server-side verification mandatory
2. **Webhook Signature Verification Bypass** - Always verify signatures
3. **Webhook Race Conditions** - Idempotency handling required
4. **Subscription State Drift** - Periodic reconciliation needed
5. **SSR Hydration Mismatch** - Use `<ClientOnly>` for Stripe.js
6. **Nitro Body Parsing Breaking Signatures** - Use `readRawBody()` not `readBody()`

**Prevention Strategies:**
- Use Nitro middleware for consistent payment enforcement
- Implement MongoDB transactions for atomic updates
- Add periodic Stripe-to-MongoDB reconciliation
- Test with Stripe CLI for local webhook testing

---

## Implications for Roadmap

Based on research findings, the suggested phase structure for v1.1:

### Phase 1: Database & API Foundation (3-5 days)
**Addresses:**
- Architecture component: Subscription model
- Pitfall: State synchronization (MongoDB transactions)

**Tasks:**
1. Create Subscription model with indexes
2. Update Plan model with subscription fields
3. Create subscription API endpoints
4. Implement MongoDB transactions for atomic updates

**Avoids:**
- Pitfall: Payment bypass (server-side validation)
- Pitfall: Missing webhook handlers

**Uses:**
- Stack: Mongoose with transaction support
- Architecture: Per-plan subscription model

---

### Phase 2: Webhook Infrastructure (2-3 days)
**Addresses:**
- Features: Webhook-driven payment confirmation (#5)
- Pitfall: Webhook signature verification
- Pitfall: Webhook race conditions
- Pitfall: Nitro body parsing breaking signatures

**Tasks:**
1. Implement `readRawBody()` for webhook signature verification
2. Add subscription webhook event handlers
3. Implement idempotency handling
4. Add webhook event logging

**Avoids:**
- Pitfall: Signature verification bypass
- Pitfall: Duplicate event processing

**Uses:**
- Stack: Stripe webhook signature verification
- Architecture: Webhook-driven state updates

---

### Phase 3: Access Control & Security (2-3 days)
**Addresses:**
- Features: Pre-payment access control (#1)
- Pitfall: Payment bypass via client-side manipulation
- Pitfall: Subscription status not checked before access

**Tasks:**
1. Create Nitro middleware for payment verification
2. Add subscription checks to PDF generation
3. Add subscription checks to QR access endpoints
4. Implement server-side payment enforcement

**Avoids:**
- Pitfall: Client-side only payment checks
- Pitfall: Subscription access without active status

**Uses:**
- Architecture: Access control enforcement points
- Pitfall prevention: Server-side verification

---

### Phase 4: Frontend Integration (4-6 days)
**Addresses:**
- Features: Payment status persistence (#2), Payment history (#6)
- Pitfall: SSR hydration mismatch with Stripe.js

**Tasks:**
1. Create `payments.ts` Pinia store
2. Build PaymentForm component (pay-per-plan)
3. Build SubscriptionForm component (per-plan)
4. Build PaymentStatus component
5. Build SubscriptionManager component
6. Wrap Stripe.js in `<ClientOnly>`

**Avoids:**
- Pitfall: SSR hydration issues
- Pitfall: Missing loading fallbacks

**Uses:**
- Stack: Nuxt UI Pro v4 components
- Architecture: Frontend component structure

---

### Phase 5: Subscription Management (3-4 days)
**Addresses:**
- Features: Per-plan subscription (#4), Pause/resume (#8), Cancellation (#9)
- Features: Failed payment handling (#7)

**Tasks:**
1. Implement Stripe Checkout for subscriptions
2. Add Customer Portal for self-service management
3. Implement subscription pause/resume
4. Implement subscription cancellation
5. Add Stripe Smart Retries for failed payments

**Avoids:**
- Anti-feature: Tiered subscriptions
- Anti-feature: Free trials

**Uses:**
- Stack: Stripe Checkout for subscriptions
- Stack: Stripe Customer Portal

---

### Phase 6: Testing & Monitoring (2-3 days)
**Addresses:**
- All pitfalls: Testing strategies
- Pitfall: Testing payment flows with real money

**Tasks:**
1. Set up Stripe CLI for local webhook testing
2. Implement payment bypass testing
3. Test webhook signature verification
4. Test idempotency (duplicate webhooks)
5. Test race conditions (concurrent webhooks)
6. Set up monitoring for warning signs
7. Implement periodic reconciliation job

**Avoids:**
- Pitfall: Real payments during testing
- Pitfall: Missing replay attack detection

**Uses:**
- Pitfall prevention: Testing strategies
- Architecture: State reconciliation

---

## Phase Ordering Rationale

**Why this order based on dependencies discovered in research:**

1. **Database first (Phase 1)** - All other phases depend on Subscription model and API endpoints. Architecture research confirmed this is the foundation.

2. **Webhooks second (Phase 2)** - Pitfalls research highlighted webhook signature verification and idempotency as critical security requirements. Must be in place before any payment processing.

3. **Access control third (Phase 3)** - Pitfalls research identified payment bypass as the #1 security risk. Server-side enforcement must be in place before exposing any payment-gated features.

4. **Frontend fourth (Phase 4)** - SSR hydration pitfalls require proper `<ClientOnly>` wrapping. Frontend builds on API and access control foundation.

5. **Subscription management fifth (Phase 5)** - Features research confirmed pause/resume and cancellation are table stakes. Builds on all previous phases.

6. **Testing sixth (Phase 6)** - Pitfalls research provided comprehensive testing checklist. All phases must be complete before final testing.

**Why this grouping based on PITFALLS.md prevention strategies:**

- **Phases 1-3** focus on preventing critical security pitfalls (payment bypass, signature verification, state synchronization)
- **Phases 4-5** focus on user-facing features with proper safeguards in place
- **Phase 6** validates all prevention strategies are working

---

## Research Flags for Phases

**Phase 1 (Database & API):** Standard patterns, unlikely to need research
- MongoDB transactions are well-documented
- Subscription schema is straightforward

**Phase 2 (Webhooks):** Standard patterns, unlikely to need research
- Stripe webhook documentation is comprehensive
- Existing implementation provides template

**Phase 3 (Access Control):** Standard patterns, unlikely to need research
- Nitro middleware pattern is established
- Existing payment enforcement provides template

**Phase 4 (Frontend):** Standard patterns, unlikely to need research
- Nuxt UI Pro v4 components are documented
- Existing payment components provide template

**Phase 5 (Subscription Management):** Standard patterns, unlikely to need research
- Stripe Checkout is well-documented
- Customer Portal is standard Stripe feature

**Phase 6 (Testing):** Standard patterns, unlikely to need research
- Stripe CLI provides local testing
- Pitfalls research provided testing checklist

---

## Open Questions Resolved

| Question | Resolution | Source |
|----------|------------|--------|
| Which Stripe packages to use? | Existing `stripe` v18.5.0 and `@stripe/stripe-js` v7.9.0 are current | STACK.md |
| Checkout or Elements for subscriptions? | Stripe Checkout for subscriptions, Elements for one-time | STACK.md |
| How to handle per-plan subscriptions? | Subscription model with planId reference | ARCHITECTURE.md |
| How to prevent payment bypass? | Server-side verification at all access points | PITFALLS.md |
| How to handle webhook reliability? | Idempotency + signature verification + reconciliation | PITFALLS.md |
| What features are table stakes? | 10 features identified for v1.1 | FEATURES.md |
| What features should we avoid? | 10 anti-features documented | FEATURES.md |
| How to handle SSR with Stripe? | Use `<ClientOnly>` wrapper | PITFALLS.md |

---

## Sources Summary

**Primary Sources (HIGH Confidence):**
- Stripe Official Documentation (Checkout, Webhooks, Subscriptions, Billing)
- Stripe Dev Blog (Building rock-solid integrations, Database infrastructure)
- Nuxt 4 Documentation (Hydration best practices)
- Stripe Webhooks Official Docs (Signature verification, replay prevention)

**Secondary Sources (MEDIUM Confidence):**
- Community tutorials (Djamware Nuxt 4 + Stripe, Cody Bontecou)
- Industry best practices (SaaSFrame, SaaS billing platforms)
- Security advisories (GitHub security, payment bypass patterns)

**All sources cited in respective dimension files.**

---

## Next Steps

**Immediate:** Review research files and approve roadmap approach

**Recommended:** Proceed with `/gsd:create-roadmap` using this phase structure:
1. Database & API Foundation
2. Webhook Infrastructure
3. Access Control & Security
4. Frontend Integration
5. Subscription Management
6. Testing & Monitoring

**Alternative:** Run `/gsd:define-requirements` to refine requirements before roadmap creation

---

*Research completed: 2026-01-25*
*Valid until: 2026-03-01 (60 days - Stripe and Nuxt ecosystems evolve rapidly)*
