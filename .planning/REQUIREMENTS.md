# Requirements: v9planesN3Bui3

**Defined:** 2026-01-25
**Milestone:** v1.1 Stripe Payments
**Core Value:** Compliant safety plans, efficiently generated — Users create legally compliant Spanish construction safety plans with optional real-time issue tracking

## v1 Requirements

Requirements for v1.1 Stripe Payments milestone. Each maps to roadmap phases.

### Payment Flow Control (Pay-to-Print Model)

- [x] **PAY-01**: System blocks plan PDF generation/printing until successful payment confirmation
- [x] **PAY-02**: User can create and fill plans for free, but must pay to print/generate PDF
- [x] **PAY-02a**: Plan creation form is accessible without payment
- [x] **PAY-02b**: Print button triggers payment flow if no payment exists

### Payment Status & Display

- [x] **STAT-01**: Payment status persists in database (pending, paid, failed)
- [x] **STAT-02**: Payment timestamp and amount stored with plan
- [x] **STAT-03**: Visual status badges display (✅ Paid, ⏳ Pending, ❌ Failed)

### One-Time Payment (Stripe Checkout)

- [x] **PAY-03**: Embedded Stripe Checkout session for pay-per-plan transaction
- [x] **PAY-04**: Checkout session includes plan metadata (user, plan name)
- [x] **PAY-05**: Success URL redirects back to plan page to trigger PDF generation after payment

### Per-Plan Subscription

- [ ] **SUB-01**: Per-plan monthly subscription for QR issue reporting access
- [x] **SUB-02**: Subscription status tracked (active, past_due, canceled, paused, expired)
- [x] **SUB-03**: Annual pre-payment option with 10-20% discount
- [x] **SUB-04**: Subscription access enforced at API/route level for QR reporting

### Webhook Infrastructure

- [x] **WEB-01**: `/api/webhooks/stripe` endpoint for Stripe events
- [x] **WEB-02**: Webhook signature verification on all requests
- [x] **WEB-03**: Idempotency handling for duplicate/retry events
- [x] **WEB-04**: Event logging for debugging and monitoring
- [x] **WEB-05**: Handler for `checkout.session.completed` (payment succeeded)
- [x] **WEB-06**: Handler for `payment_intent.payment_failed` (payment failed)
- [x] **WEB-07**: Handlers for subscription lifecycle (created, updated, deleted)
- [x] **WEB-08**: Handlers for invoice events (paid, failed)

### Payment History & Invoices

- [ ] **HIST-01**: User-facing payment history table
- [ ] **HIST-02**: Invoice PDF download via Stripe-hosted URLs
- [ ] **HIST-03**: Invoice PDF download via download button in payment history

### Failed Payment Handling (Dunning)

- [ ] **DUNN-01**: Stripe Smart Retries enabled for failed payments
- [ ] **DUNN-02**: Webhook handler for `invoice.payment_failed` events
- [ ] **DUNN-03**: 7-day grace period with service still active
- [ ] **DUNN-04**: Email notification via Mailgun on payment failure
- [ ] **DUNN-05**: Update payment method link via Stripe Customer Portal

### Subscription Management

- [x] **MGMT-01**: Pause subscription with `pause_collection` behavior
- [x] **MGMT-02**: Resume paused subscription
- [x] **MGMT-03**: Cancel subscription immediately or at period end
- [x] **MGMT-04**: Clear UI indication of cancellation date and access period

### Security & Compliance

- [x] **SEC-01**: Stripe Checkout for PCI DSS SAQ A compliance
- [x] **SEC-02**: No raw card data storage (Stripe handles everything)
- [x] **SEC-03**: CSP headers whitelist Stripe domains (js.stripe.com, checkout.stripe.com)
- [x] **SEC-04**: HTTPS only in production
- [x] **SEC-05**: Webhook signature verification mandatory on all events

### Payment Method Management

- [x] **METH-01**: Update payment method via Stripe Customer Portal
- [x] **METH-02**: Self-service payment method management

## v2 Requirements (Deferred)

### Differentiators

**Bulk Payment:**
- PAY-D01: Pay for multiple plans at once with payment credits

**Multi-Currency:**
- PAY-D02: Accept payments in EUR, USD, GBP for international clients

**Usage Analytics:**
- AN-D01: Admin dashboard showing revenue per plan, churn rate, MRR
- AN-D02: Payment failure rate tracking

**Payment Reminders:**
- PAY-D03: Notify users 3 days before subscription renewal

### Table Stakes (Deferred)

**Pre-Payment Access Control Enhancements:**
- PAY-D04: Fallback polling if webhook delayed >30 seconds
- PAY-D05: Optimistic UI updates after payment with webhook confirmation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-user subscription tiers | Our model: pay-per-plan, not pay-per-user |
| Free trial periods | Pay-for-what-you-use model, no free trials |
| Annual/monthly toggle | Subscriptions are monthly only; annual is separate pre-pay |
| Tiered subscription levels | Single subscription per plan with clear value prop |
| Usage-based billing | Flat monthly fee per plan is simpler and more predictable |
| Prorated upgrades/downgrades | Pause/resume is better than proration for this use case |
| Self-service refunds | Support ticket process for refund requests |
| Payment plan installments | Flat fee model; Stripe financing available instead |
| Gift subscriptions | B2B use case: companies pay for their own plans |
| Dynamic pricing (time-based) | Consistent pricing is better than promotional discounts |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAY-01 | Phase 9 | Pending |
| PAY-02 | Phase 9 | Pending |
| STAT-01 | Phase 7 | Complete |
| STAT-02 | Phase 7 | Complete |
| STAT-03 | Phase 10 | Pending |
| PAY-03 | Phase 10 | Pending |
| PAY-04 | Phase 10 | Pending |
| PAY-05 | Phase 10 | Pending |
| SUB-01 | Phase 18 | Pending |
| SUB-02 | Phase 7 | Complete |
| SUB-03 | Phase 7 | Complete |
| SUB-04 | Phase 9 | Complete |
| WEB-01 | Phase 17 | Pending |
| WEB-02 | Phase 17 | Pending |
| WEB-03 | Phase 17 | Pending |
| WEB-04 | Phase 17 | Pending |
| WEB-05 | Phase 8 | Complete |
| WEB-06 | Phase 8 | Complete |
| WEB-07 | Phase 8 | Complete |
| WEB-08 | Phase 8 | Complete |
| HIST-01 | Phase 12 | Complete |
| HIST-02 | Phase 12 | Complete |
| HIST-03 | Phase 18 | Pending |
| DUNN-01 | Phase 12 | Complete |
| DUNN-02 | Phase 12 | Complete |
| DUNN-03 | Phase 12 | Complete |
| DUNN-04 | Phase 12 | Complete |
| DUNN-05 | Phase 12 | Complete |
| MGMT-01 | Phase 11 | Complete |
| MGMT-02 | Phase 11 | Complete |
| MGMT-03 | Phase 11 | Complete |
| MGMT-04 | Phase 11 | Complete |
| SEC-01 | Phase 16 | Complete |
| SEC-02 | Phase 16 | Complete |
| SEC-03 | Phase 16 | Complete |
| SEC-04 | Phase 16 | Complete |
| SEC-05 | Phase 16 | Complete |
| METH-01 | Phase 11 | Complete |
| METH-02 | Phase 11 | Complete |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓
- Pending gap closure: SEC-01–05, SUB-01, HIST-03 (Phase 16–18)
- Complete: 21/28

---

**Core Value:** Compliant safety plans, efficiently generated
**Alignment:** ✓ Covered (payment system enables monetization while safety plan generation is the core product)

*Requirements defined: 2026-01-25*
*Last updated: 2026-02-12 after Phase 11 completion*
