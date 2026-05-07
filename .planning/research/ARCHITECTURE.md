# Payment System Integration Architecture

**Project:** v9planesN3Bui3 - v1.1 Stripe Payments Integration
**Researched:** 2025-01-25
**Domain:** Payment system integration for Nuxt 3/4 + MongoDB SaaS
**Confidence:** HIGH

## Executive Summary

Payment systems in Nuxt 3/4 + MongoDB applications follow a well-established pattern: **server-side payment creation → client-side confirmation → webhook-driven state updates**. The architecture separates concerns cleanly between frontend (Pinia stores for UI state), backend (Nitro server routes for Stripe API calls), and webhook handlers (async state synchronization).

**Primary recommendation:** Use the existing Payment Intent flow (already implemented) and extend it with per-plan subscriptions. The webhook-driven approach ensures data consistency between Stripe and your database, with real-time UI updates via Server-Sent Events (SSE).

**Key architectural principles:**
1. **Server-side payment creation** - Never create Payment Intents from the client
2. **Webhook as source of truth** - Payment state changes flow from Stripe → webhook → database → UI
3. **Per-plan subscription model** - Each plan has its own subscription, enabling granular control
4. **Real-time UI updates** - Use SSE for payment status updates without polling

## Component Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │ Components   │  │  Composables │      │
│  │  (Vue 3)     │──│  (UI Views)  │──│  (Logic)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Pinia Stores  │                        │
│                    │  (State Mgmt)  │                        │
│                    │  - user.ts     │                        │
│                    │  - planes.ts   │                        │
│                    │  - payments.ts │ ← NEW                  │
│                    └───────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   $fetch API    │
                    │  (HTTP Calls)   │
                    └────────┬────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     BACKEND LAYER (Nitro)                     │
│                     ┌────────▼────────┐                       │
│                     │ Server Routes    │                       │
│                     │ /api/payments/*  │                       │
│                     │  - create-intent │                       │
│                     │  - webhook       │                       │
│                     │  - check-status  │                       │
│                     │  - history       │                       │
│                     │  - cancel        │                       │
│                     │  - analytics     │                       │
│                     └────────┬────────┘                       │
│                              │                                 │
│              ┌───────────────┼───────────────┐                │
│              │               │               │                │
│      ┌───────▼────────┐ ┌───▼────────┐ ┌──▼───────────┐    │
│      │ Stripe Service │ │   Models    │ │  SSE Manager  │    │
│      │  (API Calls)   │ │ (Mongoose)  │ │ (Real-time)   │    │
│      └────────────────┘ └───┬────────┘ └───────────────┘    │
│                              │                                 │
│              ┌───────────────┼───────────────┐                │
│              │               │               │                │
│      ┌───────▼────────┐ ┌───▼────────┐ ┌──▼───────────┐    │
│      │   Payments     │ │   Planes    │ │    User      │    │
│      │   Collection   │ │ Collection  │ │ Collection   │    │
│      └────────────────┘ └────────────┘ └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Stripe API      │
                    │  (External)       │
                    │  - Payment Intents│
                    │  - Subscriptions  │
                    │  - Webhooks       │
                    └───────────────────┘
```

### Component Boundaries

#### Frontend Components (Client-Side)

**Pinia Store: `payments.ts`** (NEW)
```typescript
// /app/stores/payments.ts
export const usePaymentsStore = defineStore('payments', {
  state: () => ({
    currentPayment: null,           // Active payment for current plan
    paymentHistory: [],             // User's payment history
    loading: false,
    error: null
  }),

  actions: {
    // Create payment intent for a plan
    async createPaymentIntent(planId: string) { }

    // Check payment status
    async checkPaymentStatus(paymentId: string) { }

    // Cancel payment intent
    async cancelPayment(paymentId: string) { }

    // Load payment history
    async loadPaymentHistory(userId: string) { }

    // SSE: Listen for payment updates
    listenForPaymentUpdates(userId: string) { }
  }
})
```

**Integration with existing stores:**
- **`planes.ts`** - Already has payment fields (`paymentStatus`, `paymentId`, `canPrint`)
- **`user.ts`** - Already has `precioPSS` field for pricing
- **NEW: `payments.ts`** - Dedicated payment state management

#### Backend Components (Server-Side)

**Server Routes (Already Implemented)**
```
/server/api/payments/
├── create-intent.post.ts    ✅ DONE - Create Payment Intent
├── webhook.post.ts           ✅ DONE - Handle Stripe webhooks
├── check-status.post.ts      ✅ DONE - Check payment status
├── history.get.ts            ✅ DONE - Get payment history
├── cancel.post.ts            ✅ DONE - Cancel payment
├── analytics.get.ts          ✅ DONE - Payment analytics
└── events.get.ts             ✅ DONE - Get payment events
```

**Models (Already Implemented)**
```typescript
// server/models/Payment.ts
interface IPayment {
  _id: string
  userId: string
  planId: string
  stripePaymentIntentId: string
  stripeInvoiceId?: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  paymentMethod?: string
  description?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// server/models/Invoice.ts (already exists)
interface IInvoice {
  _id: string
  userId: string
  planId: string
  paymentId: string
  stripeInvoiceId: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'void'
  description: string
  customerInfo: { ... }
  companyInfo: { ... }
  lineItems: [ ... ]
  paidAt: Date
}
```

**NEW: Subscription Model (To Be Added)**
```typescript
// server/models/Subscription.ts
interface ISubscription {
  _id: string
  userId: string
  planId: string                    // Per-plan subscription
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: 'active' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  amount: number
  currency: string
  interval: 'month' | 'year'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### Data Flow

#### Pay-Per-Plan Flow (Already Implemented)

```
USER ACTION                    FRONTEND                    BACKEND                    STRIPE
     │                            │                           │                          │
     ├── 1. Click "Pay for Plan"  │                           │                          │
     │                            │                           │                          │
     │                            ├── POST /api/payments/create-intent            │
     │                            │    { planId }            │                          │
     │                            │                           │                          │
     │                            │                           ├── Create Payment Intent │
     │                            │                           │  (stripe.paymentIntents.create)  │
     │                            │                           │                          │
     │                            │                           ├── Save Payment (status: pending)   │
     │                            │                           │  └─ paymentId           │
     │                            │                           │                          │
     │                            │                           ├── Update Plan (paymentStatus: processing)
     │                            │                           │                          │
     │                            │   ← { clientSecret,       │                          │
     │                            │        paymentIntentId }   │                          │
     │                            │                           │                          │
     ├── 2. Confirm Payment       │                           │                          │
     │    (Stripe Elements)       │                           │                          │
     │                            │                           │                          │
     │                            ├── stripe.confirmCardPayment(clientSecret)    │
     │                            │                           │                          │
     │                            │                           │      ├── Process Payment│
     │                            │                           │                          │
     │                            │   ← { paymentIntent }     │                          │
     │                            │                           │                          │
     │                            ├── Listen for updates      │                          │
     │                            │    (SSE connection)       │                          │
     │                            │                           │                          │
     │                            │                           │                          │
     │                            │                           │   3. Webhook Triggered │
     │                            │                           │                          │
     │                            │                           │   ← payment_intent.succeeded
     │                            │                           │                          │
     │                            │                           ├── Update Payment (status: succeeded)
     │                            │                           │                          │
     │                            │                           ├── Update Plan (paymentStatus: paid, canPrint: true)
     │                            │                           │                          │
     │                            │                           ├── Create Invoice       │
     │                            │                           │                          │
     │                            │                           ├── Send SSE Event →     │
     │                            │                           │    payment_success      │
     │                            │                           │                          │
     │                            │   ← SSE: payment_success  │                          │
     │                            │      { paymentId,         │                          │
     │                            │        planId,            │                          │
     │                            │        invoiceId }        │                          │
     │                            │                           │                          │
     ├── 4. Show Success &       │                           │                          │
     │     Enable Print          │                           │                          │
     │                            │                           │                          │
```

#### Per-Plan Subscription Flow (To Be Implemented)

```
USER ACTION                    FRONTEND                    BACKEND                    STRIPE
     │                            │                           │                          │
     ├── 1. Subscribe to Plan     │                           │                          │
     │                            │                           │                          │
     │                            ├── POST /api/payments/create-subscription       │
     │                            │    { planId, interval }  │                          │
     │                            │                           │                          │
     │                            │                           ├── Create/Get Customer  │
     │                            │                           │                          │
     │                            │                           ├── Create Subscription  │
     │                            │                           │  (stripe.subscriptions.create)
     │                            │                           │                          │
     │                            │                           ├── Save Subscription     │
     │                            │                           │  (status: active)        │
     │                            │                           │                          │
     │                            │                           ├── Update Plan           │
     │                            │                           │  (subscriptionId,       │
     │                            │                           │   canPrint: true)        │
     │                            │                           │                          │
     │                            │   ← { subscriptionId,     │                          │
     │                            │        clientSecret,      │                          │
     │                            │        status }           │                          │
     │                            │                           │                          │
     ├── 2. Confirm Payment       │                           │                          │
     │    (Stripe Elements)       │                           │                          │
     │                            │                           │                          │
     │                            ├── stripe.confirmCardPayment(clientSecret)    │
     │                            │                           │                          │
     │                            │   ← { subscription }      │                          │
     │                            │                           │                          │
     │                            │                           │   3. Webhook Triggered │
     │                            │                           │                          │
     │                            │                           │   ← invoice.payment_succeeded
     │                            │                           │                          │
     │                            │                           ├── Update Subscription  │
     │                            │                           │                          │
     │                            │                           ├── Send SSE Event →     │
     │                            │                           │    subscription_updated  │
     │                            │                           │                          │
     │                            │   ← SSE: subscription     │                          │
     │                            │      updated              │                          │
     │                            │                           │                          │
     ├── 4. Show Success &       │                           │                          │
     │     Enable Print          │                           │                          │
     │                            │                           │                          │
     │                            │                           │                          │
     │   ┌────────────────────────────────────────────────────────────────────┐
     │   │ SUBSCRIPTION RENEWAL (Automatic, Background)                       │
     │   │                                                                    │
     │   │                         STRIPE                        BACKEND     │
     │   │                            │                             │        │
     │   │  1. Renewal Due             │                             │        │
     │   │                            │                             │        │
     │   │  ├── Charge Customer        │                             │        │
     │   │                            │                             │        │
     │   │  ├── invoice.payment_succeeded ────────────────────────────→│        │
     │   │                            │                             │        │
     │   │                            │                             ├── Update Subscription
     │   │                            │                             │  (currentPeriodEnd)  │
     │   │                            │                             │        │
     │   │                            │                             ├── Extend Plan Access
     │   │                            │                             │  (canPrint: true)      │
     │   │                            │                             │        │
     │   │                            │   2. OPTIONAL: Notify User →│        │
     │   │                            │     (Email/SSE)            │        │
     │   └────────────────────────────────────────────────────────────────────┘
```

### Webhook Architecture

#### Webhook Event Types

**Payment Intent Events** (Already Implemented)
```typescript
payment_intent.succeeded     → Payment complete, enable plan access
payment_intent.payment_failed → Payment failed, update status
payment_intent.canceled      → Payment canceled, reset plan status
```

**Subscription Events** (To Be Implemented)
```typescript
customer.subscription.created   → New subscription created
invoice.payment_succeeded        → Subscription payment successful
invoice.payment_failed           → Subscription payment failed
customer.subscription.updated    → Subscription modified
customer.subscription.deleted    → Subscription canceled
```

#### Webhook Handler Structure

```typescript
// /server/api/payments/webhook.post.ts
export default defineEventHandler(async (event) => {
  // 1. Verify signature (CRITICAL for security)
  const stripeEvent = verifyWebhookSignature(body, signature)

  // 2. Route to appropriate handler
  switch (stripeEvent.type) {
    // Payment Intents (already implemented)
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(stripeEvent.data.object)
      break

    // Subscriptions (to be implemented)
    case 'customer.subscription.created':
      await handleSubscriptionCreated(stripeEvent.data.object)
      break

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(stripeEvent.data.object)
      break

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(stripeEvent.data.object)
      break
  }

  // 3. Return 200 OK immediately (idempotency)
  return { received: true }
})
```

**Critical Webhook Best Practices:**

1. **Return 200 OK quickly** - Don't block webhook response on database writes
2. **Handle idempotency** - Process same event multiple times safely
3. **Verify signature** - Always verify Stripe signature for security
4. **Handle duplicates** - Stripe may send same event multiple times
5. **Use raw body** - Signature verification requires raw request body

### Real-time Updates (SSE)

**Server-Sent Events Architecture** (Already Implemented)

```typescript
// /server/utils/sse.ts
class SSEManager {
  connections: Map<string, Set<ReadableStream>>

  sendToUser(userId: string, event: string, data: any) {
    // Send event to all active connections for user
  }
}

// Usage in webhook handler
sseManager.sendToUser(userId, 'payment_success', {
  paymentId: payment._id,
  planId: payment.planId,
  amount: payment.amount
})
```

**Client-Side SSE Listener** (To Be Implemented in payments store)

```typescript
// /app/stores/payments.ts
listenForPaymentUpdates(userId: string) {
  const eventSource = new EventSource(
    `/api/payments/events?userId=${userId}`
  )

  eventSource.addEventListener('payment_success', (e) => {
    const data = JSON.parse(e.data)
    // Update store state
    this.currentPayment = { ...this.currentPayment, status: 'succeeded' }
    // Refresh plan data
    this.planesStore.loadPlanActual(data.planId)
  })

  eventSource.addEventListener('payment_failed', (e) => {
    const data = JSON.parse(e.data)
    this.currentPayment = { ...this.currentPayment, status: 'failed' }
    this.error = data.error
  })
}
```

## Database Schema

### Payment Collection (Already Implemented)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // References User
  planId: ObjectId,              // References Plan
  stripePaymentIntentId: String, // Unique Stripe Payment Intent ID
  stripeInvoiceId: String,       // Stripe Invoice ID (after payment)
  amount: Number,                // Payment amount in euros
  currency: String,              // 'eur'
  status: String,                // 'pending' | 'succeeded' | 'failed' | 'canceled'
  paymentMethod: String,         // Payment method used
  description: String,           // Payment description
  metadata: {
    planName: String,
    stripeCustomerId: String
  },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - { userId: 1, planId: 1 }     // User's payments for a plan
  - { stripePaymentIntentId: 1 } // Unique Stripe ID
  - { status: 1 }                // Filter by status
  - { createdAt: -1 }            // Recent payments first
```

### Subscription Collection (To Be Implemented)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // References User
  planId: ObjectId,              // References Plan (PER-PLAN subscription)
  stripeSubscriptionId: String,  // Unique Stripe Subscription ID
  stripeCustomerId: String,      // Stripe Customer ID
  status: String,                // 'active' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodEnd: Date,        // Subscription renewal date
  cancelAtPeriodEnd: Boolean,    // True if scheduled to cancel
  amount: Number,                // Subscription amount in euros
  currency: String,              // 'eur'
  interval: String,              // 'month' | 'year'
  metadata: {
    planName: String
  },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - { userId: 1, planId: 1 }     // User's subscriptions for a plan
  - { stripeSubscriptionId: 1 } // Unique Stripe ID
  - { status: 1 }                // Filter by status
  - { currentPeriodEnd: 1 }      // Upcoming renewals
```

### Plan Document Updates (Already Partially Implemented)

```javascript
// Existing fields in Planes model
{
  // ... existing fields ...

  // Payment-related fields (already exist)
  paymentStatus: String,         // 'unpaid' | 'processing' | 'paid'
  paymentId: ObjectId,           // References Payment
  paidAt: Date,                  // Payment completion date
  canPrint: Boolean,             // Access control flag

  // NEW: Subscription-related fields (to be added)
  subscriptionId: ObjectId,      // References Subscription
  subscriptionStatus: String,    // 'none' | 'active' | 'past_due' | 'canceled'
  subscriptionPeriodEnd: Date,   // Subscription renewal date
  hasAccess: Boolean             // Combined access flag (payment OR subscription)
}

// Access control logic
hasAccess = canPrint || (subscriptionStatus === 'active' && subscriptionPeriodEnd > new Date())
```

## Access Control Architecture

### Access Control Enforcement Points

**1. Plan Creation Flow**
```typescript
// /app/stores/planes.ts
async createPlan(planData: Partial<Plan>) {
  // Create plan with payment required
  const plan = await $fetch('/api/planes', {
    method: 'POST',
    body: {
      ...planData,
      paymentStatus: 'unpaid',
      canPrint: false
    }
  })

  return plan
}
```

**2. Plan Detail Page - Payment Gate**
```typescript
// /pages/protected/planes/[id].vue
const canAccessPlan = computed(() => {
  return plan.paymentStatus === 'paid' ||
         plan.subscriptionStatus === 'active'
})

// Show payment form if no access
// Show plan content if access granted
```

**3. PDF Generation - Payment Validation**
```typescript
// /server/api/planes/[id]/generate-pdf.get.ts
export default defineEventHandler(async (event) => {
  const plan = await Planes.findById(id)

  // Check payment OR subscription
  if (!plan.canPrint && plan.subscriptionStatus !== 'active') {
    throw createError({
      statusCode: 402,
      statusMessage: 'Payment required'
    })
  }

  // Check subscription expiration
  if (plan.subscriptionStatus === 'active') {
    if (plan.subscriptionPeriodEnd < new Date()) {
      throw createError({
        statusCode: 402,
        statusMessage: 'Subscription expired'
      })
    }
  }

  // Generate PDF...
})
```

**4. QR Access - Subscription Validation**
```typescript
// /server/api/public/planes/[id]/[slug].get.ts
export default defineEventHandler(async (event) => {
  const plan = await Planes.findById(id)

  // Check QR enabled
  if (!plan.qrEnabled || !plan.qrCode?.enabled) {
    throw createError({ statusCode: 403, statusMessage: 'QR access disabled' })
  }

  // Check QR expiration
  if (plan.qrCode.expiresAt < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'QR code expired' })
  }

  // Check payment OR subscription
  if (!plan.canPrint && plan.subscriptionStatus !== 'active') {
    throw createError({
      statusCode: 402,
      statusMessage: 'Payment or active subscription required'
    })
  }

  // Return plan data (filtered for public access)
})
```

## Build Order (Dependencies)

### Phase 1: Foundation (Already Done ✅)

1. **Payment Model** ✅
   - Payment schema with Mongoose
   - Indexes for query performance

2. **Payment Intent Flow** ✅
   - Create payment intent endpoint
   - Webhook handler for payment events
   - Invoice generation

3. **SSE Infrastructure** ✅
   - SSE manager for real-time updates
   - Event streaming to clients

### Phase 2: Per-Plan Subscriptions (NEW)

**Order:**

1. **Subscription Model** (1-2 days)
   - Create Subscription schema in `/server/models/Subscription.ts`
   - Add indexes (userId+planId, stripeSubscriptionId, status)
   - Create migration script if needed

2. **Subscription API Endpoints** (2-3 days)
   ```
   POST /api/payments/create-subscription
   - Create Stripe subscription
   - Save to database
   - Update plan with subscriptionId

   GET /api/payments/subscriptions/[planId]
   - Get subscription details for a plan

   POST /api/payments/subscriptions/[id]/cancel
   - Cancel subscription
   - Update plan status

   GET /api/payments/subscriptions
   - List all user's subscriptions
   ```

3. **Webhook Handlers for Subscriptions** (1-2 days)
   - `customer.subscription.created`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

4. **Update Plan Model** (1 day)
   - Add subscription fields to Planes schema
   - Migration script to update existing plans
   - Update canPrint logic to include subscription check

5. **Frontend: Payments Store** (2-3 days)
   - Create `/app/stores/payments.ts`
   - Actions: createSubscription, cancelSubscription, checkStatus
   - SSE integration for real-time updates

6. **Frontend: Payment Components** (2-3 days)
   - PaymentForm component (pay-per-plan)
   - SubscriptionForm component (per-plan subscription)
   - PaymentStatus component (display status)
   - SubscriptionManager component (manage subscriptions)

7. **Access Control Updates** (1-2 days)
   - Update PDF generation endpoint
   - Update QR access endpoint
   - Add subscription checks to plan routes

8. **Testing & Validation** (2-3 days)
   - Unit tests for subscription logic
   - Integration tests for webhook handlers
   - E2E tests for payment/subscription flows
   - Stripe webhooks testing (local + production)

**Total Estimate: 12-19 days**

### Phase 3: Enhanced Features (Optional)

1. **Subscription Dashboard** (2-3 days)
   - List all subscriptions
   - Usage metrics
   - Renewal reminders

2. **Payment History UI** (2 days)
   - Payment history page
   - Invoice download
   - Receipt generation

3. **Admin Analytics** (2-3 days)
   - Revenue dashboard
   - Subscription metrics
   - Churn analysis

## Integration Points with Existing System

### 1. User Store Integration

**Existing fields in User model:**
```typescript
precioPSS?: number  // User's custom price per plan
```

**Integration:**
- Use `precioPSS` for payment intent amount
- Use `precioPSS` for subscription pricing
- Fall back to default price if not set

### 2. Planes Store Integration

**Existing fields in Plan model:**
```typescript
paymentStatus: 'unpaid' | 'processing' | 'paid'
paymentId: ObjectId
canPrint: Boolean
```

**NEW fields to add:**
```typescript
subscriptionId: ObjectId
subscriptionStatus: 'none' | 'active' | 'past_due' | 'canceled'
subscriptionPeriodEnd: Date
hasAccess: Boolean  // Computed: canPrint OR (subscriptionStatus === 'active')
```

**Integration:**
- Update `loadPlanActual()` to fetch subscription data
- Add `checkPlanAccess(planId)` method
- Add `subscribeToPlan(planId, interval)` method
- Add `cancelPlanSubscription(planId)` method

### 3. API Route Integration

**New routes to add:**
```
POST /api/payments/create-subscription
GET  /api/payments/subscriptions/[planId]
POST /api/payments/subscriptions/[id]/cancel
GET  /api/payments/subscriptions
```

**Existing routes to update:**
```
PATCH /api/planes/[id]  - Add subscription fields
GET   /api/planes/[id]  - Include subscription data
```

### 4. Middleware Integration

**Access control middleware** (NEW):
```typescript
// /server/middleware/subscription.ts
export default defineEventHandler((event) => {
  // Check if route requires subscription
  if (event.context.requiresSubscription) {
    const plan = await Planes.findById(event.context.planId)

    if (!plan.hasAccess) {
      throw createError({
        statusCode: 402,
        statusMessage: 'Payment or subscription required'
      })
    }
  }
})
```

## Key Design Decisions

### 1. Per-Plan Subscriptions vs. User-Level Subscriptions

**Decision: Per-plan subscriptions**

**Rationale:**
- Granular control - Each construction project is independent
- Flexible pricing - Different plans can have different subscription amounts
- Clear billing - Customers know exactly what they're paying for
- Easy to manage - Cancel subscription for a specific project without affecting others

**Tradeoffs:**
- More subscriptions to manage (one per plan)
- More complex billing (multiple line items)
- Requires subscription management UI

### 2. Payment Intent vs. Checkout Session

**Decision: Payment Intent API**

**Rationale:**
- More control over payment flow
- Custom payment form UI
- Better integration with existing UI components
- Real-time payment status updates

**Tradeoffs:**
- Requires more development effort
- Must handle PCI compliance (client-side)
- More complex error handling

### 3. Webhook-Driven State Updates vs. Polling

**Decision: Webhook-driven with SSE for real-time updates**

**Rationale:**
- Event-driven architecture (Stripe is source of truth)
- Near-instant updates (webhook + SSE)
- No unnecessary API calls (polling)
- Better scalability

**Tradeoffs:**
- More complex infrastructure (webhook endpoint)
- Requires signature verification
- SSE connection management

### 4. Embedded Subscription vs. Hosted Checkout

**Decision: Embedded (Stripe Elements + Payment Intents)

**Rationale:**
- Seamless user experience
- Consistent UI/UX with existing app
- More control over branding
- Real-time validation

**Tradeoffs:**
- More development effort
- PCI compliance requirements
- Must handle payment method updates

## Security Considerations

### 1. Webhook Signature Verification

**CRITICAL:** Always verify Stripe webhook signatures

```typescript
const webhookSecret = useRuntimeConfig().stripeWebhookSecret
const stripeEvent = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
)
```

### 2. Payment Intent Authentication

**Require authentication for payment creation:**
```typescript
const authenticatedUser = event.context.user
if (!authenticatedUser) {
  throw createError({ statusCode: 401 })
}
```

### 3. Plan Ownership Validation

**Ensure user owns plan they're paying for:**
```typescript
const plan = await Planes.findOne({
  _id: planId,
  createdBy: userId  // Must match authenticated user
})
```

### 4. Idempotency Handling

**Handle duplicate webhook events:**
```typescript
// Check if payment already processed
if (payment.status === 'succeeded') {
  console.log('Payment already processed, skipping')
  return
}
```

### 5. Rate Limiting

**Implement rate limiting on payment endpoints:**
```typescript
// Prevent abuse
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 payment attempts per window
})
```

## Testing Strategy

### 1. Unit Tests

**Payment Intent Creation:**
```typescript
describe('createPaymentIntent', () => {
  it('should create payment intent for valid plan', async () => {
    const result = await createPaymentIntent(planId, userId)
    expect(result.clientSecret).toBeDefined()
    expect(result.paymentIntentId).toBeDefined()
  })

  it('should fail if plan already paid', async () => {
    await expect(
      createPaymentIntent(paidPlanId, userId)
    ).rejects.toThrow('Plan is already paid for')
  })
})
```

### 2. Integration Tests

**Webhook Handling:**
```typescript
describe('webhook handler', () => {
  it('should process payment_intent.succeeded', async () => {
    const event = mockStripeEvent('payment_intent.succeeded')
    const response = await webhookHandler(event)
    expect(response.received).toBe(true)

    const payment = await Payment.findById(paymentId)
    expect(payment.status).toBe('succeeded')
  })
})
```

### 3. E2E Tests

**Complete Payment Flow:**
```typescript
describe('payment flow', () => {
  it('should complete payment end-to-end', async () => {
    // 1. User creates plan
    const plan = await createPlan(planData)

    // 2. User initiates payment
    const paymentIntent = await createPaymentIntent(plan._id, userId)

    // 3. User confirms payment (mock)
    await confirmPayment(paymentIntent.clientSecret)

    // 4. Webhook processes payment
    await triggerWebhook('payment_intent.succeeded', paymentIntent.id)

    // 5. Plan is accessible
    const updatedPlan = await getPlan(plan._id)
    expect(updatedPlan.canPrint).toBe(true)
  })
})
```

### 4. Stripe Webhook Testing

**Local Testing:**
```bash
# Forward Stripe webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

**Production Testing:**
```bash
# Use Stripe CLI to test production webhooks
stripe listen --forward-to https://your-domain.com/api/payments/webhook

# Or use Stripe Dashboard to send test webhooks
```

## Common Pitfalls to Avoid

### 1. Missing Stripe Signature Verification

**Pitfall:** Not verifying webhook signatures allows attackers to send fake webhooks

**Solution:**
```typescript
// ALWAYS verify signature
const stripeEvent = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
)
```

### 2. Not Handling Idempotency

**Pitfall:** Processing same webhook event multiple times causes duplicate data

**Solution:**
```typescript
// Check if already processed
if (payment.status === 'succeeded') {
  return { received: true } // Idempotent response
}
```

### 3. Blocking Webhook Response

**Pitfall:** Long-running database operations block webhook response, Stripe retries

**Solution:**
```typescript
// Return 200 OK quickly, process asynchronously
return { received: true }

// Or use job queue for heavy operations
await queue.add('process-payment', { paymentId })
```

### 4. Not Updating Plan Access

**Pitfall:** Payment succeeds but plan access not enabled

**Solution:**
```typescript
// Always update plan in webhook handler
await Planes.findByIdAndUpdate(planId, {
  paymentStatus: 'paid',
  canPrint: true
})
```

### 5. Hardcoding Price

**Pitfall:** Price hardcoded in code, can't update without deployment

**Solution:**
```typescript
// Use user's custom price or default
const amount = Math.round((user.precioPSS || 99) * 100)
```

## Sources

### Primary (HIGH Confidence)

- **Stripe Official Documentation** - Webhooks best practices, signature verification, event handling
  - URL: https://docs.stripe.com/webhooks
- **Stripe Dev Blog** - Building rock-solid Stripe integrations (Feb 2025)
  - URL: https://stripe.dev/blog/building-solid-stripe-integrations-developers-guide-success
- **Nuxt 4 + Stripe Tutorial** - Complete integration with server routes and webhooks (Dec 2025)
  - URL: https://www.djamware.com/post/693eb332b00ad03314a098d2/stripe-payments-in-nuxt-4-with-server-routes-and-webhooks

### Secondary (MEDIUM Confidence)

- **How to Accept Payments with Nuxt and Stripe** (Dec 2025)
  - URL: https://dev.to/wobsoriano/how-to-accept-payments-with-nuxt-and-stripe-56ip
- **MongoDB Schema Design Patterns** - MongoDB official documentation
  - URL: https://www.mongodb.com/docs/manual/data-modeling/design-patterns/
- **Stripe Integration in Nuxt 3** - Comprehensive course by Cody Bontecou
  - URL: https://codybontecou.com/stripe-integration-in-nuxt-3

### Tertiary (LOW Confidence)

- **MongoDB Community Forums** - Subscription schema discussions (2022-2023)
  - URL: https://www.mongodb.com/community/forums/t/how-to-handle-recurring-orders-schema-in-mongodb/143719
- **Stack Overflow** - MongoDB schema for subscription plans
  - URL: https://stackoverflow.com/questions/54196438/mongodb-schema-for-account-creation-with-subscription-plan

## Open Questions

### Resolved
- ✅ How to handle payment state updates? → Webhook-driven with SSE for real-time UI
- ✅ Where to store payment data? → Separate Payment collection (already implemented)
- ✅ How to implement per-plan subscriptions? → Subscription collection with planId reference
- ✅ How to enforce access control? → Multiple enforcement points (PDF generation, QR access, plan routes)

### To Be Validated
- ⏳ Should we support multiple payment methods per plan? (Currently: single payment intent)
- ⏳ How to handle subscription refunds? (Need to implement webhook handler)
- ⏳ Should we implement free trial periods? (Requires Stripe trial configuration)
- ⏳ How to handle plan transfer between users? (Need to update ownership logic)
- ⏳ Should we implement payment method saving for one-click payments? (Requires Stripe SetupIntent)

### Recommendations for Next Steps

1. **Start with Phase 2.1** - Implement Subscription model first (foundation)
2. **Test webhook flow** - Use Stripe CLI for local testing before production
3. **Implement access control** - Update PDF generation and QR access endpoints
4. **Create payments store** - Centralized payment state management
5. **Build UI components** - Payment form, subscription form, status display
6. **Comprehensive testing** - Unit, integration, and E2E tests

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Payment Intent Flow | HIGH | Already implemented and tested |
| Webhook Architecture | HIGH | Based on Stripe official best practices |
| Subscription Model | HIGH | Standard MongoDB + Stripe pattern |
| Access Control | HIGH | Clear enforcement points identified |
| Real-time Updates (SSE) | HIGH | Already implemented and working |
| Build Order | MEDIUM | Depends on team velocity and complexity |
| Refund Handling | LOW | Not yet implemented, needs validation |
| Trial Periods | LOW | Stripe configuration not explored |

**Research Date:** 2025-01-25
**Valid Until:** 2025-03-25 (60 days - Stripe and Nuxt ecosystems evolve rapidly)

---

## Appendix: Quick Reference

### Key Files Reference

```
Models:
├── /server/models/Payment.ts           ✅ EXISTS
├── /server/models/Invoice.ts           ✅ EXISTS
├── /server/models/Subscription.ts      ❌ TO CREATE
└── /server/models/Planes.ts            ✅ EXISTS (needs updates)

API Routes:
├── /server/api/payments/
│   ├── create-intent.post.ts           ✅ EXISTS
│   ├── webhook.post.ts                 ✅ EXISTS
│   ├── check-status.post.ts            ✅ EXISTS
│   ├── history.get.ts                  ✅ EXISTS
│   ├── cancel.post.ts                  ✅ EXISTS
│   ├── analytics.get.ts                ✅ EXISTS
│   └── events.get.ts                   ✅ EXISTS
│   ├── create-subscription.post.ts     ❌ TO CREATE
│   ├── subscriptions/[planId].get.ts   ❌ TO CREATE
│   ├── subscriptions/[id]/cancel.post.ts ❌ TO CREATE
│   └── subscriptions.get.ts            ❌ TO CREATE

Stores:
├── /app/stores/user.ts                 ✅ EXISTS
├── /app/stores/planes.ts               ✅ EXISTS (needs updates)
└── /app/stores/payments.ts             ❌ TO CREATE

Utils:
├── /server/utils/stripe.ts             ✅ EXISTS
├── /server/utils/sse.ts                ✅ EXISTS
└── /server/middleware/subscription.ts  ❌ TO CREATE

Components:
├── PaymentForm.vue                     ❌ TO CREATE
├── SubscriptionForm.vue                ❌ TO CREATE
├── PaymentStatus.vue                   ❌ TO CREATE
└── SubscriptionManager.vue             ❌ TO CREATE
```

### Stripe Webhook Events Reference

```
Payment Intents:
├── payment_intent.succeeded      → Payment complete
├── payment_intent.payment_failed → Payment failed
└── payment_intent.canceled       → Payment canceled

Subscriptions:
├── customer.subscription.created   → New subscription
├── customer.subscription.updated   → Subscription modified
├── customer.subscription.deleted   → Subscription canceled
├── invoice.payment_succeeded        → Subscription paid
└── invoice.payment_failed           → Subscription payment failed
```

### Access Control Logic

```typescript
// Pseudo-code for access control
function hasAccess(plan: Plan): boolean {
  return (
    plan.paymentStatus === 'paid' ||
    (
      plan.subscriptionStatus === 'active' &&
      plan.subscriptionPeriodEnd > new Date()
    )
  )
}
```

### Payment Flow Checklist

```
Pay-Per-Plan Flow:
□ User clicks "Pay for Plan"
□ Create Payment Intent (server-side)
□ Confirm Payment (Stripe Elements)
□ Webhook: payment_intent.succeeded
□ Update Payment status to 'succeeded'
□ Update Plan: paymentStatus='paid', canPrint=true
□ Create Invoice
□ Send SSE event to client
□ UI updates: Show success, enable print
□ User can generate PDF

Subscription Flow:
□ User clicks "Subscribe to Plan"
□ Create Subscription (server-side)
□ Confirm Payment (Stripe Elements)
□ Webhook: invoice.payment_succeeded
□ Update Subscription: status='active'
□ Update Plan: subscriptionStatus='active', canPrint=true
□ Send SSE event to client
□ UI updates: Show success, enable print
□ User can generate PDF
□ Monthly: Webhook: invoice.payment_succeeded
□ Update Subscription: currentPeriodEnd
□ Extend Plan access
```

---

**END OF ARCHITECTURE DOCUMENT**
