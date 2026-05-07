# FEATURES.md: Payment Flow Features for v1.1 Stripe Payments

**Project:** v9planesN3Bui3 - Construction Safety Plan Management SaaS
**Payment Model:** Pay-per-plan one-time payment + optional per-plan QR issue reporting subscription
**Researched:** 2026-01-25
**Overall Confidence:** HIGH

## Executive Summary

Based on comprehensive research of SaaS payment flows, Stripe best practices, and 2026 industry standards, this document categorizes payment features for v1.1. The research focused on pay-per-transaction flows with per-item subscriptions (not per-user pricing), which is less common than standard tiered subscription models.

**Key insight:** The pay-per-plan + per-plan-subscription model requires careful scoping. Many standard SaaS billing features (tiered plans, per-user pricing, annual/monthly toggles) don't apply. Instead, focus on transactional payment enforcement and per-item subscription management.

**Primary recommendation:** Start with table stakes features for v1.1, defer differentiators to v1.2+, and explicitly avoid anti-features that don't fit the model.

---

## TABLE STAKES (Must-Have for v1.1)

*Users expect these features. Absence causes churn, support burden, or trust issues.*

### 1. Pre-Payment Access Control

**What:** Prevent users from creating safety plans without successful payment

**Why it's table stakes:** Pay-per-transaction model requires enforcement. Without this, users bypass payment, breaking the business model.

**Implementation requirements:**
- Block "Create new plan" action until payment confirmed
- Show payment barrier before plan creation form
- Async webhook confirmation (don't rely on client-side success only)
- Fallback: Poll payment status if webhook delayed

**Complexity:** MEDIUM
- Dependencies: Stripe Checkout session creation, webhook handling
- Webhook event: `checkout.session.completed`
- Edge case: User closes browser before webhook fires

**Implementation pattern:**
```typescript
// Flow:
1. User clicks "Create Plan"
2. Create Stripe Checkout Session with plan metadata
3. Redirect to Stripe Checkout (embedded)
4. On return: Check payment status (optimistic)
5. Webhook confirms: Update DB, unlock plan creation
6. Fallback: Poll payment status if webhook delayed > 30s
```

**Anti-pattern to avoid:** Client-side only validation (bypassable)

---

### 2. Payment Status Persistence & Display

**What:** Store payment state per plan and display current payment/subscription status

**Why it's table stakes:** Users need to know what they've paid for and subscription status. Support burden without this.

**Implementation requirements:**
- Payment status field in Plan document: `paymentStatus` (pending/paid/failed)
- Subscription status field: `subscriptionStatus` (active/canceled/past_due/paused/expired)
- Payment timestamp and amount
- Subscription period (current_period_end, cancel_at_period_end)

**Complexity:** LOW
- Dependencies: Webhook updates to Plan document
- Database changes: Add payment/subscription fields to Plan schema

**Status badges:**
- ✅ Paid - One-time payment succeeded
- ⏳ Pending - Payment initiated, awaiting confirmation
- ❌ Failed - Payment failed
- 🔄 Active - Subscription active
- ⏸️ Paused - Subscription paused
- ⏹️ Canceled - Subscription canceled

**Verification:** Based on Stripe subscription lifecycle patterns and payment state management best practices.

---

### 3. One-Time Payment Flow with Stripe Checkout

**What:** Embedded Stripe Checkout for pay-per-plan transaction

**Why it's table stakes:** Industry standard for SaaS payments. Stripe Checkout provides:
- PCI compliance (you don't handle card data)
- 40+ payment methods
- Built-in fraud protection
- Mobile-optimized UI
- 2026 standard: Embedded checkout (no redirect to separate page)

**Complexity:** LOW (Stripe Checkout is low-code)
- Dependencies: Stripe Checkout Session API
- Configuration: Product/Price in Stripe Dashboard

**Implementation requirements:**
- Stripe Checkout Session with `mode: 'payment'`
- Embedded checkout (not hosted page redirect)
- Metadata: `{ planId, userId, planName }`
- Success URL: Redirect back to plan creation form
- Cancel URL: Return to plans list with message

**Payment before service delivery:**
```typescript
// Critical: Do NOT create plan in DB before payment succeeds
// Flow:
1. Initiate payment → Create Checkout Session (no plan yet)
2. Payment succeeds → Webhook creates plan in DB with paymentStatus=paid
3. Redirect user → Plan creation form unlocked
```

**Webhook events:**
- `checkout.session.completed` → Create plan, set paymentStatus=paid
- `payment_intent.payment_failed` → Set paymentStatus=failed, notify user

**Sources:**
- [Stripe Checkout Documentation](https://docs.stripe.com/checkout)
- [Stripe Payment Processing Best Practices](https://www.checkout.com/blog/best-practices-for-secure-online-payment-processing) (MEDIUM confidence)
- [SaaS Payment Process 2026](https://www.airwallex.com/eu/blog/saas-payment-process-for-dutch-businesses) (MEDIUM confidence)

---

### 4. Per-Plan Subscription Management (QR Issue Reporting)

**What:** Optional monthly subscription PER PLAN for QR issue reporting access

**Why it's table stakes:** This is the core subscription feature. Users expect to manage subscriptions per plan.

**Subscription model specifics:**
- NOT per-user pricing (no user tiers)
- Per-item subscription: Each plan has optional subscription
- Single subscription per plan (no multiple tiers per plan)
- Monthly recurring charge
- Service: QR issue reporting access (enforced at API/route level)

**Implementation requirements:**
- Stripe Subscription with `mode: 'subscription'`
- One subscription item per plan
- Link subscription to Plan document via metadata
- Enforce: QR issue reporting routes check subscription status

**Complexity:** MEDIUM
- Dependencies: Stripe Billing, webhook handling
- Enforcement: API middleware checks subscription status

**Subscription lifecycle:**
```typescript
// States:
active      - Subscription current, service accessible
past_due    - Payment failed, grace period
canceled    - Canceled by user or admin
paused      - Temporarily suspended (optional v1.1 feature)
expired     - Past billing period, not renewed
```

**Access enforcement:**
```typescript
// Middleware for QR issue reporting routes:
if (plan.subscriptionStatus !== 'active') {
  throw new Error('QR issue reporting requires active subscription')
}
```

**Per-item vs per-user distinction:**
- Standard SaaS: User has subscription, all their plans have access
- Our model: Each plan has its own subscription
- User can have 10 plans, 3 with active subscriptions, 7 without

**Sources:**
- [Stripe Subscription Pricing Models](https://stripe.com/resources/more/subscription-pricing-models-a-guide-for-businesses) (HIGH confidence)
- [Stripe Billing Features](https://stripe.com/billing/features) (HIGH confidence)
- [Per-Item Subscription Best Practice](https://www.reddit.com/r/stripe/comments/1okqhbf/best_practice_for_modeling_multiple_product/) (LOW confidence - needs verification)

---

### 5. Webhook-Driven Payment Confirmation

**What:** Async webhook handlers update system state after Stripe events

**Why it's table stakes:** Synchronous payment confirmation is unreliable. Webhooks are the source of truth for payment state.

**Implementation requirements:**
- Webhook endpoint: `/api/webhooks/stripe`
- Signature verification (critical for security)
- Idempotency handling (retry-safe)
- Event logging for debugging
- Fallback polling for delayed webhooks

**Webhook events to handle:**
```typescript
// One-time payments:
checkout.session.completed    → Payment succeeded, unlock plan creation
payment_intent.payment_failed  → Payment failed, notify user

// Subscriptions:
customer.subscription.created   → New subscription, link to plan
customer.subscription.updated   → Status change, update plan
customer.subscription.deleted   → Canceled/expired, revoke access
invoice.paid                    → Payment succeeded, update status
invoice.payment_failed          → Payment failed, handle dunning
invoice.marked_uncollectible    → Write off, cancel subscription
```

**Complexity:** MEDIUM
- Dependencies: Stripe webhooks, signature verification
- Security: Verify Stripe signature on every request
- Edge cases: Duplicate events, out-of-order delivery

**Webhook security:**
```typescript
// CRITICAL: Verify webhook signature
import Stripe from 'stripe'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const signature = headers['stripe-signature']

let event
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
} catch (err) {
  throw new Error('Invalid webhook signature')
}
```

**Sources:**
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks) (HIGH confidence)
- [Stripe Payment Event Handling](https://docs.stripe.com/webhooks/handling-payment-events) (HIGH confidence)
- [Build Secure Stripe Payments with Webhooks](https://www.nextwork.org/projects/ai-finops-stripe) (MEDIUM confidence)

---

### 6. Payment History & Invoice Access

**What:** Users can view past payments and download invoices/receipts

**Why it's table stakes:** Users expect to access payment records for:
- Expense tracking and accounting
- Tax documentation
- Dispute resolution
- Business expense reimbursement

**Implementation requirements:**
- Payment history table: Date, amount, status, invoice link
- Invoice PDF download (Stripe-hosted invoices)
- Filter by plan or date range
- Export to CSV (optional v1.1)

**Complexity:** LOW
- Dependencies: Stripe Invoice API
- Stripe hosts invoices, we link to them

**Data model:**
```typescript
// Payment history (stored in Plan document):
payments: [{
  id: string                    // Stripe Payment Intent ID
  date: Date
  amount: number
  currency: string
  status: 'succeeded' | 'failed' | 'pending'
  invoiceUrl?: string           // Stripe invoice PDF URL
  type: 'one_time' | 'subscription'
  subscriptionId?: string       // For subscription payments
}]
```

**UI requirements:**
- Table component (use existing `TableBase` or `TableGenericDocPer`)
- Sortable columns (date, amount, status)
- Status badges (paid, failed, pending)
- Invoice download button
- Mobile-responsive table

**Invoice access:**
- Use Stripe-hosted invoice PDFs
- Invoice URL: `invoice.invoice_pdf`
- Access control: Only user who paid can view
- No authentication required for invoice PDF (Stripe token)

**Sources:**
- [SaaS Billing UI Design Examples 2026](https://www.saasframe.io/categories/upgrading) (MEDIUM confidence)
- [SaaS Billing Platforms 2026](https://www.outseta.com/posts/best-saas-billing-platforms) (MEDIUM confidence)
- [Stripe Invoice API](https://docs.stripe.com/api/invoices) (HIGH confidence)

---

### 7. Failed Payment Handling (Dunning Management)

**What:** Automatic retry logic and user notifications for failed subscription payments

**Why it's table stakes:** Subscriptions fail. Cards expire. Without handling:
- Users lose access unexpectedly
- Support tickets increase
- Involuntary churn spikes

**Implementation requirements:**
- Stripe Smart Retries (automatic, ML-powered)
- Webhook event: `invoice.payment_failed`
- Grace period: Keep service active for 3-7 days
- User notification: Email (Mailgun) when payment fails
- Update UI: Show "payment failed" status with action button
- Retry logic: Stripe automatically retries with exponential backoff

**Complexity:** MEDIUM
- Dependencies: Stripe Smart Retries, Mailgun
- Configuration: Stripe Dashboard retry settings

**Stripe Smart Retries:**
- ML-based optimal retry timing
- Trained on billions of data points
- Automatically analyzes decline codes
- Determines best retry window (hours vs days)

**Dunning workflow:**
```typescript
// Failed payment handling:
1. invoice.payment_failed webhook received
2. Update Plan: subscriptionStatus = 'past_due'
3. Check retry attempt count
4. Send email notification via Mailgun
5. Update UI: Show "Payment failed - update payment method"
6. Stripe retries payment automatically (Smart Retries)
7. If retry succeeds: invoice.paid → subscriptionStatus = 'active'
8. If final retry fails: subscriptionStatus = 'canceled', revoke access
```

**Decline code handling:**
- Temporary issue (insufficient funds): Smart retry → silent recovery
- Authentication issue (expired card): Pause retries → notify user
- Permanent failure (card lost): Stop retries → update customer

**Grace period:**
- Keep QR issue reporting active for 7 days after first failure
- Clear messaging: "Your payment failed. Service will be canceled on [date] unless updated."
- Update payment method link (Stripe Customer Portal)

**Sources:**
- [Stripe Payment Retries 101](https://stripe.com/resources/more/payment-retries-101-how-businesses-can-make-the-most-of-this-important-detail) (HIGH confidence)
- [Stripe Failed Payment Recovery](https://stripe.com/resources/more/failed-payment-recovery-101-what-businesses-can-do) (HIGH confidence)
- [Stripe Smart Retries Blog](https://stripe.com/blog/how-we-built-it-smart-retries) (HIGH confidence)
- [Stripe Decline Codes Explained](https://medium.com/@umesh_meenal/stripe-decline-codes-explained-what-your-failed-payments-are-really-telling-you-06edcc6b0354) (LOW confidence)

---

### 8. Subscription Pause/Resume (Per Plan)

**What:** Users can temporarily pause a plan's subscription and resume later

**Why it's table stakes:** Construction projects pause. Users shouldn't pay for QR reporting when no work is happening. Flexibility reduces cancellation.

**Implementation requirements:**
- Pause subscription: Set `pause_collection` in Stripe
- Resume subscription: Remove `pause_collection`
- UI: Pause button in subscription management
- Display: Paused subscriptions show status badge
- Access control: Paused = no QR reporting access

**Complexity:** MEDIUM
- Dependencies: Stripe Subscription API
- Pause behavior: No billing while paused, service suspended

**Pause options:**
```typescript
// Stripe pause_collection behavior:
{
  pause_collection: {
    behavior: 'keep_as_draft'  // Don't invoice during pause
  }
}
```

**Pause workflow:**
```typescript
// User pauses subscription:
1. Click "Pause subscription" button
2. Call Stripe API: Update subscription with pause_collection
3. Webhook: customer.subscription.updated
4. Update Plan: subscriptionStatus = 'paused'
5. Enforce: QR reporting returns 403 (subscription not active)
6. UI: Show "Paused - Resume to restore access"

// User resumes subscription:
1. Click "Resume subscription" button
2. Call Stripe API: Remove pause_collection
3. Stripe immediately invoices (prorated)
4. Webhook: customer.subscription.updated
5. Update Plan: subscriptionStatus = 'active'
6. Enforce: QR reporting access restored
```

**Benefits:**
- Retention tool: Better than canceling
- Flexibility: Matches construction project cycles
- User control: Self-service pause/resume

**Sources:**
- [Stripe Pause Collection](https://docs.stripe.com/billing/subscriptions/subscription-life-cycle) (HIGH confidence - inferred)
- [FastSpring Subscription Pause](https://fastspring.com/blog/enhance-customer-experience-with-fastsprings-subscription-pause-feature/) (MEDIUM confidence)
- [Subscription Pause Benefits](https://medium.com/@buckyjames/unlocking-the-potential-of-subscription-pause-retaining-customers-with-flexible-options-fbcfa2e7835) (MEDIUM confidence)

---

### 9. Subscription Cancellation (Immediate vs End of Period)

**What:** Users can cancel subscriptions with option for immediate or end-of-billing-period effect

**Why it's table stakes:** Users expect control. Forcing immediate cancellation causes frustration. Legal requirement in some jurisdictions.

**Implementation requirements:**
- Cancel immediately: `cancel_at_period_end = false`
- Cancel at period end: `cancel_at_period_end = true`
- UI: Clear option selection
- Confirmation: "Are you sure?" with explanation
- Access control: Immediate cancel = revoke access now, period end = access until [date]

**Complexity:** LOW
- Dependencies: Stripe Subscription API
- Webhook: `customer.subscription.deleted`

**Cancellation modes:**
```typescript
// Immediate cancellation:
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: false
})
await stripe.subscriptions.cancel(subscriptionId)
// Access revoked immediately

// End of period cancellation:
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true
})
// Access continues until period_end
```

**UI requirements:**
- Clear distinction between cancellation modes
- Show date when access will end
- Confirmation dialog explaining consequences
- Feedback: "Subscription will cancel on [date]. You can resume before then."

**Don't hide cancellation:**
- Making cancellation hard creates resentment
- Offer alternatives when canceling (pause, downgrade)
- Ask for feedback: Why are you canceling?

**Sources:**
- [Best Practices for Plan Upgrades/Downgrades](https://kinde.com/learn/billing/plans/best-practices-for-handling-plan-upgrades-and-downgrades/) (MEDIUM confidence)
- [Subscription Pause Enhances Customer Experience](https://fastspring.com/blog/enhance-customer-experience-with-fastsprings-subscription-pause-feature/) (MEDIUM confidence)

---

### 10. Security & Compliance (PCI DSS, CSP)

**What:** Secure payment processing with proper compliance

**Why it's table stakes:** Payment security is non-negotiable. Vulnerabilities lead to:
- Legal liability
- Stripe account termination
- User trust loss
- Regulatory fines

**Implementation requirements:**
- Stripe Checkout (PCI DSS SAQ A - lowest burden)
- No raw card data storage (Stripe handles everything)
- CSP headers: Whitelist Stripe domains
- Webhook signature verification (mandatory)
- HTTPS only (enforced in production)
- SRI for external resources

**Complexity:** MEDIUM (setup complexity, low ongoing maintenance)

**PCI DSS compliance:**
- Stripe Checkout: SAQ A compliance (self-assessment questionnaire)
- You never touch card data → lowest PCI burden
- Stripe handles all PCI requirements

**CSP configuration:**
```typescript
// nuxt.config.ts - CSP for Stripe:
{
  'script-src': [
    "'self'",
    'https://js.stripe.com',           // Stripe.js
    'https://checkout.stripe.com'       // Checkout
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://hooks.stripe.com',
    'https://checkout.stripe.com'
  ],
  'connect-src': [
    'https://api.stripe.com'
  ],
  'img-src': [
    'https://*.stripe.com'              // Stripe images
  ]
}
```

**Webhook security:**
```typescript
// ALWAYS verify webhook signature
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
)
```

**Sources:**
- [Payment Gateway Integration Guide 2026](https://neontri.com/blog/payment-gateway-integration/) (MEDIUM confidence)
- [Best Practices for Secure Online Payment Processing](https://www.checkout.com/blog/best-practices-for-secure-online-payment-processing) (MEDIUM confidence)
- [SaaS Compliance Requirements](https://stripe.com/resources/more/saas-compliance-requirements-and-how-companies-meet-them) (HIGH confidence)

---

## DIFFERENTIATORS (Competitive Advantage)

*Nice-to-have features that distinguish v9planes from competitors.*

### D1. Bulk Payment (Pay for Multiple Plans at Once)

**What:** User pays for 5 plans, gets 5 plan creation credits

**Why it's differentiator:** Competitors likely require per-transaction payment. Bulk payment saves checkout friction for high-volume users.

**Complexity:** HIGH
- Dependencies: Payment credit system
- Implementation: Store payment credits in user account, deduct on plan creation

**Use case:** Construction company creating 10 safety plans for 10 projects

**V1.1 status:** DEFER to v1.2+

---

### D2. Subscription Discounts (Annual Pre-Pay)

**What:** Pay for 12 months upfront, get 10-20% discount

**Why it's differentiator:** Cash flow optimization for users. Commitment discount improves retention.

**Complexity:** MEDIUM
- Dependencies: Stripe Coupon/Promotion Code API
- Implementation: Create annual subscription price with discount

**Use case:** Year-long construction project, pay upfront vs monthly

**V1.1 status:** DEFER to v1.2+

---

### D3. Payment Method Management (Update Card)

**What:** Users can update payment method without canceling subscription

**Why it's differentiator:** Self-service reduces support burden. Competitors may require cancel/recreate to update card.

**Complexity:** LOW
- Dependencies: Stripe Customer Portal
- Implementation: Hosted Stripe portal for payment method management

**V1.1 status:** NICE TO HAVE if time permits, else v1.2

---

### D4. Usage Analytics (Payment Metrics Dashboard)

**What:** Admin dashboard showing:
- Revenue per plan
- Subscription churn rate
- Payment failure rate
- MRR (Monthly Recurring Revenue)

**Why it's differentiator:** Data-driven business decisions. Competitors may lack analytics.

**Complexity:** MEDIUM
- Dependencies: Analytics queries, dashboard UI

**V1.1 status:** DEFER to v1.2+

---

### D5. Multi-Currency Support

**What:** Accept payments in EUR, USD, GBP for international clients

**Why it's differentiator:** Construction companies work across borders. Local currency increases conversion.

**Complexity:** MEDIUM
- Dependencies: Stripe multi-currency pricing
- Implementation: Create prices for each currency, detect user locale

**V1.1 status:** DEFER to v1.2+

---

### D6. Payment Reminders (Proactive Dunning)

**What:** Notify users 3 days before subscription renewal

**Why it's differentiator:** Reduces failed payments from expired cards. Proactive vs reactive.

**Complexity:** LOW
- Dependencies: Stripe upcoming invoice webhooks, Mailgun
- Implementation: `invoice.upcoming` webhook → email 3 days before

**V1.1 status:** NICE TO HAVE if time permits

---

## ANTI-FEATURES (Deliberately NOT Build)

*Features that don't fit our model or create unnecessary complexity.*

### A1. Per-User Subscription Tiers

**What:** User pays for "Pro plan" and gets unlimited plan access

**Why we're NOT building it:**
- Our model: Pay-per-plan, not pay-per-user
- User can have 100 plans, each with optional subscription
- Tiers don't make sense with transactional pricing

**Alternative:** Pay-per-plan pricing is simpler and more transparent

---

### A2. Free Trial Periods

**What:** "Try QR reporting free for 14 days"

**Why we're NOT building it:**
- Requires credit card upfront (friction)
- Or requires cancellation to avoid charge (dark pattern)
- Our model: Pay for what you use
- Free trial abuse is common

**Alternative:** Demo plans with limited features (already exists)

---

### A3. Annual/Monthly Toggle

**What:** Switch between monthly and annual billing

**Why we're NOT building it:**
- Our subscriptions are monthly only
- Annual pre-pay is differentiator (D2), not toggle
- Simplifies pricing page

**Alternative:** Single monthly subscription, annual pre-pay as discount

---

### A4. Tiered Subscription Levels (Basic/Pro/Premium)

**What:** Three subscription tiers with different features

**Why we're NOT building it:**
- Our model: One subscription = QR reporting access
- Feature creep: What goes in each tier?
- Decision paralysis for users
- Support burden explaining tier differences

**Alternative:** Single subscription per plan with clear value prop

---

### A5. Usage-Based Billing

**What:** Charge per QR issue reported, not flat monthly fee

**Why we're NOT building it:**
- Complexity: Track usage, calculate charges, unpredictable bills
- User preference: Flat fee = predictable costs
- Our model: Simple subscription is better

**Alternative:** Flat monthly fee per plan (simpler)

---

### A6. Prorated Upgrades/Downgrades

**What:** Change subscription mid-period, charge prorated difference

**Why we're NOT building it:**
- We don't have tiers to upgrade/downgrade between
- Pause/resume is better than downgrade
- Proration adds complexity for minimal value

**Alternative:** Pause/resume for temporary changes

---

### A7. Refund Management (Self-Service)

**What:** Users can request refunds with one click

**Why we're NOT building it:**
- Refund abuse is common
- Requires approval workflow anyway
- Manual refunds via Stripe Dashboard are sufficient for v1.1

**Alternative:** Support ticket for refund requests

---

### A8. Payment Plans (Installments)

**What:** Pay for plan in 3 monthly installments

**Why we're NOT building it:**
- Adds significant complexity (tracking installments)
- Our model: Flat fee is simple
- Construction companies can pay upfront

**Alternative:** Stripe financing (built-in, user-initiated)

---

### A9. Gift Subscriptions

**What:** Purchase subscription for another user

**Why we're NOT building it:**
- B2B use case: Companies pay for their own plans
- Adds complexity (user mapping, notifications)
- Low priority for v1.1

**Alternative:** User shares plan with team (existing feature)

---

### A10. Dynamic Pricing (Time-Based Discounts)

**What:** "20% off if you pay before Friday"

**Why we're NOT building it:**
- Complexity: Create/disseminate promo codes, track expiration
- User perception: "Why was it cheaper yesterday?"
- Our model: Consistent pricing is better

**Alternative:** Static pricing with occasional promotions (manual)

---

## IMPLEMENTATION DEPENDENCIES

### Feature Dependency Graph

```
Webhook Infrastructure (Table Stake #5)
├── One-Time Payment Flow (Table Stake #3)
├── Payment Status Persistence (Table Stake #2)
├── Per-Plan Subscription (Table Stake #4)
├── Failed Payment Handling (Table Stake #7)
└── Subscription Pause/Resume (Table Stake #8)

Pre-Payment Access Control (Table Stake #1)
├── Payment Status Persistence (Table Stake #2)
└── Webhook Infrastructure (Table Stake #5)

Payment History (Table Stake #6)
└── Payment Status Persistence (Table Stake #2)

Subscription Cancellation (Table Stake #9)
└── Per-Plan Subscription (Table Stake #4)
```

### Critical Path for V1.1

**Phase 1: Foundation (Week 1)**
1. Webhook infrastructure (#5) - All other features depend on this
2. Payment status persistence (#2) - Database schema changes

**Phase 2: Core Payments (Week 2)**
3. One-time payment flow (#3) - Unblock plan creation
4. Pre-payment access control (#1) - Enforce payment before creation

**Phase 3: Subscriptions (Week 3)**
5. Per-plan subscription (#4) - QR reporting subscription
6. Failed payment handling (#7) - Dunning management

**Phase 4: User Experience (Week 4)**
7. Payment history (#6) - Invoice access
8. Subscription pause/resume (#8) - Flexibility
9. Subscription cancellation (#9) - User control

**Phase 5: Security (Ongoing)**
10. Security & compliance (#10) - CSP, webhook verification

### Database Schema Changes Required

```typescript
// Add to Plan document (server/models/Planes.ts):
{
  // One-time payment
  paymentStatus: 'pending' | 'paid' | 'failed',
  paymentId: string,              // Stripe Payment Intent ID
  paymentDate?: Date,
  paymentAmount?: number,

  // Subscription (QR issue reporting)
  subscriptionId?: string,         // Stripe Subscription ID
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'paused' | 'expired',
  subscriptionPeriodEnd?: Date,    // current_period_end
  subscriptionCancelAtPeriodEnd?: boolean,

  // Payment history
  payments: [{
    id: string,                    // Stripe Payment Intent ID
    date: Date,
    amount: number,
    currency: string,
    status: 'succeeded' | 'failed' | 'pending',
    invoiceUrl?: string,
    type: 'one_time' | 'subscription',
    subscriptionId?: string
  }]
}
```

### API Endpoints Required

**Payment endpoints:**
- `POST /api/payments/create-checkout-session` - Initiate payment
- `GET /api/payments/status/:paymentId` - Check payment status (fallback)
- `POST /api/payments/webhook` - Stripe webhook handler

**Subscription endpoints:**
- `POST /api/subscriptions/create` - Create subscription for plan
- `POST /api/subscriptions/pause` - Pause subscription
- `POST /api/subscriptions/resume` - Resume subscription
- `POST /api/subscriptions/cancel` - Cancel subscription (with immediate/period_end flag)
- `GET /api/subscriptions/status/:subscriptionId` - Get subscription status

**Invoice endpoints:**
- `GET /api/invoices/history` - Get user's payment history
- `GET /api/invoices/:invoiceId/pdf` - Get invoice PDF URL

**Middleware:**
- `requireSubscription` - Check active subscription for QR reporting routes

---

## COMPLEXITY ASSESSMENT

### Low Complexity (Stripe handles most work)
- Payment status persistence (#2)
- One-time payment flow (#3)
- Payment history (#6)
- Subscription cancellation (#9)
- Security & compliance (#10)

**Timeline:** 1-2 days each

### Medium Complexity (Custom logic + Stripe)
- Webhook infrastructure (#5)
- Pre-payment access control (#1)
- Per-plan subscription (#4)
- Failed payment handling (#7)
- Subscription pause/resume (#8)

**Timeline:** 3-5 days each

### High Complexity (Significant custom logic)
- None for v1.1 table stakes
- Differentiators D1 (Bulk payment), D2 (Annual pre-pay) are high complexity

**Timeline:** 5-7 days each

---

## V1.1 SCOPE vs DEFERRED

### V1.1 MUST HAVE (Table Stakes 1-10)
All 10 table stakes features are required for functional v1.1:
- ✅ Pre-payment access control
- ✅ Payment status persistence
- ✅ One-time payment flow
- ✅ Per-plan subscription
- ✅ Webhook infrastructure
- ✅ Payment history
- ✅ Failed payment handling
- ✅ Subscription pause/resume
- ✅ Subscription cancellation
- ✅ Security & compliance

**Estimated timeline:** 4-5 weeks

### V1.2+ DEFERRED (Differentiators D1-D6)
- Bulk payment (D1)
- Annual pre-pay discounts (D2)
- Payment method management (D3)
- Usage analytics (D4)
- Multi-currency support (D5)
- Payment reminders (D6)

**Rationale:** Table stakes first. Differentiators add value but aren't critical for launch.

---

## SOURCES

### Primary (HIGH Confidence)
- [Stripe Official Documentation - Checkout](https://docs.stripe.com/checkout)
- [Stripe Official Documentation - Webhooks](https://docs.stripe.com/webhooks)
- [Stripe Official Documentation - Payment Event Handling](https://docs.stripe.com/webhooks/handling-payment-events)
- [Stripe Official Documentation - Upgrade/Downgrade Subscriptions](https://docs.stripe.com/billing/subscriptions/upgrade-downgrade)
- [Stripe Official Documentation - Invoice API](https://docs.stripe.com/api/invoices)
- [Stripe Resources - Payment Retries 101](https://stripe.com/resources/more/payment-retries-101-how-businesses-can-make-the-most-of-this-important-detail)
- [Stripe Resources - Failed Payment Recovery](https://stripe.com/resources/more/failed-payment-recovery-101-what-businesses-can-do)
- [Stripe Resources - Subscription Pricing Models](https://stripe.com/resources/more/subscription-pricing-models-a-guide-for-businesses)
- [Stripe Resources - SaaS Compliance Requirements](https://stripe.com/resources/more/saas-compliance-requirements-and-how-companies-meet-them)

### Secondary (MEDIUM Confidence)
- [SaaS Billing UI Design Examples 2026 - SaaSFrame](https://www.saasframe.io/categories/upgrading)
- [SaaS Billing Platforms 2026 - Outseta](https://www.outseta.com/posts/best-saas-billing-platforms)
- [Payment Gateway Integration Guide 2026 - Neontri](https://neontri.com/blog/payment-gateway-integration/)
- [Best Practices for Secure Online Payment Processing - Checkout.com](https://www.checkout.com/blog/best-practices-for-secure-online-payment-processing)
- [Construction Payment Processing Guide - Stripe](https://stripe.com/resources/more/construction-payment-processing)
- [SaaS Payment Process 2026 - Airwallex](https://www.airwallex.com/eu/blog/saas-payment-process-for-dutch-businesses)
- [From Integration to Infrastructure: SaaS Payments in 2026 - Payroc](https://blog.payroc.com/from-integration-to-infrastructure-saas-payments-in-2026)
- [Best Practices for Handling Plan Upgrades/Downgrades - Kinde](https://kinde.com/learn/billing/plans/best-practices-for-handling-plan-upgrades-and-downgrades/)
- [FastSpring Subscription Pause Feature](https://fastspring.com/blog/enhance-customer-experience-with-fastsprings-subscription-pause-feature/)
- [Subscription Pause Benefits - Medium](https://medium.com/@buckyjames/unlocking-the-potential-of-subscription-pause-retaining-customers-with-flexible-options-fbcfa2e7835)

### Tertiary (LOW Confidence - Needs Verification)
- [Stripe Decline Codes Explained - Medium](https://medium.com/@umesh_meenal/stripe-decline-codes-explained-what-your-failed-payments-are-really-telling-you-06edcc6b0354)
- [Per-Item Subscription Best Practice - Reddit](https://www.reddit.com/r/stripe/comments/1okqhbf/best_practice_for_modeling_multiple_product/)
- [How To Fix Failed Payments - ChurnKey](https://churnkey.co/resources/fix-cards-failing-for-stripe/)
- [Optimizing Stripe Payment Retry Logic - ChurnDog](https://churndog.com/saas-news/optimizing-your-stripe-payment-retry-logic-strategies-for-higher-recovery-rates)

---

## METADATA

**Confidence breakdown:**
- Table stakes features: HIGH - Verified with Stripe official docs
- Subscription lifecycle: HIGH - Stripe Billing documentation
- Webhook handling: HIGH - Stripe webhooks official docs
- Security requirements: HIGH - PCI DSS and Stripe security docs
- Differentiators: MEDIUM - Industry best practices, less specific documentation
- Anti-features rationale: HIGH - Logical model fit assessment

**Research date:** 2026-01-25
**Valid until:** 2026-03-01 (60 days - Stripe APIs are stable but web search results may age)

**Gaps identified:**
- Per-item subscription patterns are less common than per-user tiers (limited community examples)
- Construction SaaS payment flows are niche (limited domain-specific research)
- Spanish construction law compliance for payments (out of scope, handled separately)

**Next steps:**
- Phase-specific research for webhook infrastructure (#5)
- Implementation research for Stripe Checkout integration (#3)
- UX research for payment flow user experience (#1, #6, #9)
