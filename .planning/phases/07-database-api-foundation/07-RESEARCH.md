# Phase 7: Database & API Foundation - Research

**Researched:** 2025-01-25
**Domain:** Stripe Subscriptions, Mongoose ODM, REST API Design, Nuxt 3 Server Routes
**Confidence:** HIGH

## Summary

This phase involves creating database models and API endpoints for Stripe-based subscription management for QR issue reporting access. The research confirms that:

1. **Stripe Subscriptions API** is the standard approach for recurring billing, with robust Node.js support via the official `stripe` package (v18.5.0 already installed)
2. **Mongoose schema patterns** are well-established in the codebase (Payment, Invoice, Planes, User models) and should be followed for consistency
3. **REST API patterns** with Zod validation are the established standard across 80+ existing endpoints
4. **Annual prepayment discounts** are implemented using Stripe Coupons with `duration: 'once'` applied to annual subscriptions

**Primary recommendation:** Use Stripe Subscriptions API with a new Mongoose Subscription model, following the existing Payment/Invoice model patterns, and create RESTful endpoints with Zod validation matching the established `/api/payments/` structure.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | 18.5.0 (already installed) | Stripe API client for subscriptions | Official Stripe Node library, already configured in project |
| `mongoose` | 8.21.0 (already installed) | MongoDB ODM for subscription models | Project standard for all database models |
| `zod` | 3.25.76 (already installed) | Runtime validation for API schemas | Project standard for all API validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@stripe/stripe-js` | 7.9.0 (already installed) | Client-side Stripe elements | For future frontend integration (Phase 10) |
| Existing auth middleware | - | JWT authentication via `event.context.user` | All protected endpoints use this pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Subscriptions API | Hand-rolled subscription logic | Custom logic requires handling billing cycles, retries, proration, tax compliance - Stripe handles all this automatically |
| Mongoose schemas | Embedded in User document | Subscription data needs independent lifecycle, queries, and indexes; separate collection is cleaner |

**Installation:**
No additional packages needed. All required dependencies are already installed:
```bash
# Already installed in package.json:
# "stripe": "^18.5.0"
# "mongoose": "^8.21.0"
# "zod": "^3.25.76"
```

## Architecture Patterns

### Recommended Project Structure
```
server/
├── models/
│   └── Subscription.ts          # NEW: Mongoose subscription model
├── types/
│   └── subscription.ts          # NEW: TypeScript subscription interfaces
├── api/
│   └── subscriptions/
│       ├── index.get.ts         # GET /api/subscriptions - list user's subscriptions
│       ├── post.ts              # POST /api/subscriptions - create subscription
│       ├── [id].get.ts          # GET /api/subscriptions/:id - get single subscription
│       ├── [id].patch.ts        # PATCH /api/subscriptions/:id - update subscription
│       ├── [id].cancel.post.ts  # POST /api/subscriptions/:id/cancel - cancel subscription
│       └── [id].resume.post.ts  # POST /api/subscriptions/:id/resume - resume paused subscription
└── utils/
    └── stripe.ts                # EXISTING: Add subscription helpers
```

### Pattern 1: Mongoose Subscription Model (Follows Payment/Invoice Pattern)

**What:** Schema definition with TypeScript interfaces, indexes, and timestamps

**When to use:** All new database models must follow this pattern for consistency

**Example:**
```typescript
// server/models/Subscription.ts
import type { Document } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface ISubscription extends Document {
  _id: string
  userId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'expired'
  billingInterval: 'month' | 'year'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  annualPrepaymentDiscount?: number  // 10-20% for annual plans
  amount: number
  currency: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  planId: {
    type: String,
    required: true,
    ref: 'Plan'
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  stripePriceId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'paused', 'expired'],
    required: true,
    default: 'active'
  },
  billingInterval: {
    type: String,
    enum: ['month', 'year'],
    required: true
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  annualPrepaymentDiscount: {
    type: Number,
    min: 10,
    max: 20
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'eur'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes for query performance
SubscriptionSchema.index({ userId: 1, planId: 1 })
SubscriptionSchema.index({ stripeSubscriptionId: 1 })
SubscriptionSchema.index({ status: 1 })
SubscriptionSchema.index({ currentPeriodEnd: 1 })
SubscriptionSchema.index({ createdAt: -1 })

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema)
```

**Source:** Based on existing `/server/models/Payment.ts` and `/server/models/Invoice.ts` patterns in the codebase

### Pattern 2: REST API Endpoint with Zod Validation

**What:** Nuxt 3 server route with Zod schema validation, JWT auth via middleware

**When to use:** All API endpoints must follow this pattern for consistency

**Example:**
```typescript
// server/api/subscriptions.post.ts
import { z } from 'zod'
import { stripe } from '../../utils/stripe'
import { Subscription } from '../../models/Subscription'
import { Planes } from '../../models/Planes'

const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  billingInterval: z.enum(['month', 'year']),
  paymentMethodId: z.string().min(1, 'Payment method is required')
})

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication through middleware
    const authenticatedUser = event.context.user
    if (!authenticatedUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const userId = authenticatedUser._id.toString()

    // Parse and validate request body
    const body = await readBody(event)
    const { planId, billingInterval, paymentMethodId } = createSubscriptionSchema.parse(body)

    // Verify plan exists and belongs to user
    const plan = await Planes.findOne({ _id: planId, createdBy: userId })
    if (!plan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plan not found'
      })
    }

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      planId,
      userId,
      status: { $in: ['active', 'past_due'] }
    })

    if (existingSubscription) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Plan already has an active subscription'
      })
    }

    // Get or create Stripe customer
    const user = await User.findById(userId)
    let stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId)

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomer.id
    })

    // Set default payment method
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    // Create Stripe subscription with annual discount if applicable
    const subscriptionData: any = {
      customer: stripeCustomer.id,
      items: [{
        price: billingInterval === 'year'
          ? process.env.STRIPE_YEARLY_PRICE_ID
          : process.env.STRIPE_MONTHLY_PRICE_ID,
        quantity: 1
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      metadata: {
        userId,
        planId,
        billingInterval
      },
      expand: ['latest_invoice.payment_intent']
    }

    // Apply annual prepayment discount
    if (billingInterval === 'year') {
      subscriptionData.coupon = process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionData)

    // Save subscription to database
    const subscription = new Subscription({
      userId,
      planId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeCustomer.id,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      status: stripeSubscription.status,
      billingInterval,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      annualPrepaymentDiscount: billingInterval === 'year' ? 15 : undefined,
      amount: stripeSubscription.items.data[0].price.unit_amount / 100,
      currency: stripeSubscription.items.data[0].price.currency,
      metadata: {
        planName: plan.nom_obra
      }
    })

    await subscription.save()

    return {
      success: true,
      data: {
        subscriptionId: subscription._id,
        stripeSubscriptionId: stripeSubscription.id,
        status: subscription.status,
        clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret
      }
    }
  } catch (error: any) {
    console.error('Create subscription error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create subscription'
    })
  }
})
```

**Source:** Based on existing `/server/api/payments/create-intent.post.ts` pattern

### Pattern 3: Stripe Subscription Creation with Annual Discount

**What:** Create subscription using Stripe API with optional coupon for annual plans

**When to use:** When creating subscriptions with annual prepayment discounts

**Example:**
```typescript
// server/utils/stripe.ts - Add subscription helpers

/**
 * Create a Stripe subscription for QR issue reporting
 */
export async function createQrSubscription(params: {
  customerId: string
  planId: string
  billingInterval: 'month' | 'year'
  paymentMethodId: string
  metadata?: Record<string, any>
}) {
  const { customerId, planId, billingInterval, paymentMethodId, metadata = {} } = params

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  })

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  })

  // Build subscription data
  const subscriptionData: any = {
    customer: customerId,
    items: [{
      price: billingInterval === 'year'
        ? process.env.STRIPE_YEARLY_PRICE_ID
        : process.env.STRIPE_MONTHLY_PRICE_ID,
      quantity: 1
    }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    metadata: {
      planId,
      billingInterval,
      ...metadata
    },
    expand: ['latest_invoice.payment_intent']
  }

  // Apply annual prepayment discount coupon
  if (billingInterval === 'year' && process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID) {
    subscriptionData.coupon = process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID
  }

  const subscription = await stripe.subscriptions.create(subscriptionData)

  return subscription
}
```

**Source:** Context7 - `/stripe/stripe-node` - Create and Manage Subscriptions

### Pattern 4: Webhook Handler for Subscription Events

**What:** Handle Stripe subscription webhook events to sync database

**When to use:** For all subscription status changes from Stripe

**Example:**
```typescript
// server/api/subscriptions/webhook.post.ts
import { stripe } from '../../utils/stripe'
import { Subscription } from '../../models/Subscription'
import { Planes } from '../../models/Planes'

export default defineEventHandler(async (event) => {
  try {
    const body = await readRawBody(event)
    const signature = getHeader(event, 'stripe-signature')

    if (!signature || !body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing signature or body'
      })
    }

    // Verify webhook signature
    let stripeEvent
    try {
      const webhookSecret = useRuntimeConfig().stripeWebhookSecret
      stripeEvent = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret!
      )
    } catch (err: any) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid signature'
      })
    }

    // Handle subscription events
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(stripeEvent.data.object)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(stripeEvent.data.object)
        break
    }

    return { received: true }
  } catch (error: any) {
    console.error('Subscription webhook error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Webhook processing failed'
    })
  }
})

async function handleSubscriptionUpdated(subscription: any) {
  // Update local subscription record
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  )
}
```

**Source:** Context7 - `/stripe/stripe-node` - Verify Webhook Signatures and Handle Events

### Anti-Patterns to Avoid

- **Embedding subscriptions in User document:** Subscriptions have independent lifecycle, need separate indexes, and require complex queries. Use separate collection.
- **Storing only Stripe subscription ID:** Always sync relevant subscription data (status, period dates) to database for queries and resilience.
- **Skipping webhook signature verification:** Always verify webhook signatures to prevent fraudulent requests.
- **Using payment intents for subscriptions:** Subscriptions use different Stripe objects; don't confuse with one-time payment flows.
- **Hardcoding prices:** Use Stripe Price IDs for flexibility; update pricing in Stripe dashboard without code changes.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recurring billing logic | Custom billing cycle management | Stripe Subscriptions API | Handles billing cycles, proration, retries, failed payments, tax compliance automatically |
| Subscription state management | Custom status tracking | Stripe subscription statuses | Already handles active, past_due, canceled, paused, trialing states |
| Annual discount calculation | Manual discount math | Stripe Coupons | Create coupon once with `duration: 'once'`, apply to any annual subscription |
| Payment method storage | Custom payment method tables | Stripe Customer objects | Securely stores payment methods, handles PCI compliance |
| Invoice generation | Custom invoice creation | Stripe Invoices | Professional invoices, tax calculation, PDF generation, payment tracking |

**Key insight:** Subscription billing has complex edge cases (failed payments, retry logic, proration, tax, compliance). Stripe has solved all of these over 15+ years. Custom solutions inevitably miss edge cases that cause revenue loss or customer frustration.

## Common Pitfalls

### Pitfall 1: Not Syncing Subscription Data to Database

**What goes wrong:** Application only stores Stripe subscription ID and queries Stripe API for all data. This causes slow page loads, API rate limits, and application breaks if Stripe is down.

**Why it happens:** Developer assumes "Stripe is the source of truth, why duplicate?"

**How to avoid:** Always sync critical subscription data to local database. Use webhooks to keep in sync. Query local database for app logic, Stripe as backup.

**Warning signs:** Making multiple `stripe.subscriptions.retrieve()` calls per page load, relying solely on Stripe data for authorization checks.

### Pitfall 2: Missing Indexes on Subscription Queries

**What goes wrong:** Queries like "find active subscriptions for user" become slow as database grows.

**Why it happens:** Developer creates schema without indexes, works fine with 100 records but degrades at 10,000+.

**How to avoid:** Always add indexes for common query patterns:
```typescript
SubscriptionSchema.index({ userId: 1, status: 1 })  // For user's active subscriptions
SubscriptionSchema.index({ currentPeriodEnd: 1 })   // For upcoming renewals
SubscriptionSchema.index({ stripeSubscriptionId: 1 }) // For webhook lookups
```

**Warning signs:** Slow API responses, high database CPU on subscription queries.

### Pitfall 3: Not Handling All Subscription Statuses

**What goes wrong:** Application treats "active" as only valid status, but Stripe also uses "past_due", "canceled", "paused", "trialing". Users with "past_due" subscriptions lose access incorrectly.

**Why it happens:** Developer only tests happy path, doesn't test failed payments or cancellation flows.

**How to avoid:** Handle all Stripe subscription statuses:
- `active`: Full access
- `past_due`: Still has access (grace period)
- `canceled`: Access revoked
- `paused`: Access suspended
- `trialing`: Full access
- `expired`: Access revoked

**Warning signs:** Authorization logic that only checks `status === 'active'`.

### Pitfall 4: Annual Discount Applied Incorrectly

**What goes wrong:** Annual discount applied to every invoice instead of just first, or discount not applied at all.

**Why it happens:** Using coupon with wrong duration, or applying to price instead of subscription.

**How to avoid:** Create coupon with `duration: 'once'` in Stripe Dashboard, apply during subscription creation:
```typescript
// Correct: Apply coupon with duration: 'once'
const subscription = await stripe.subscriptions.create({
  customer: 'cus_123',
  items: [{ price: 'price_yearly' }],
  coupon: 'annual_15_percent_off'  // Only applied to first invoice
})
```

**Warning signs:** Testing shows discount on every invoice, or discount amount is zero.

### Pitfall 5: Webhook Signature Verification Skipped

**What goes wrong:** Fake webhook events processed, causing subscription data corruption or granting unauthorized access.

**Why it happens:** Developer disables verification during development, forgets to re-enable for production.

**How to avoid:** Always verify webhook signatures in production:
```typescript
const stripeEvent = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
)
```

**Warning signs:** Commented-out signature verification, webhook secret hardcoded or empty.

## Code Examples

### Creating a Subscription with Annual Discount

```typescript
// Source: Context7 - /stripe/stripe-node + Stripe coupon documentation

// 1. Create coupon in Stripe Dashboard (one-time setup):
// - Name: "Annual Prepayment 15% Off"
// - Percent: 15
// - Duration: Once

// 2. Apply coupon during subscription creation
const subscription = await stripe.subscriptions.create({
  customer: 'cus_123456',
  items: [{
    price: 'price_yearly_qr_reporting',  // Annual price
    quantity: 1
  }],
  coupon: process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID,  // Applied to first invoice only
  payment_behavior: 'default_incomplete',
  payment_settings: {
    save_default_payment_method: 'on_subscription'
  },
  metadata: {
    userId: 'user_123',
    planId: 'plan_456'
  }
})

// 3. Save to database
const dbSubscription = new Subscription({
  userId: 'user_123',
  planId: 'plan_456',
  stripeSubscriptionId: subscription.id,
  status: subscription.status,
  billingInterval: 'year',
  annualPrepaymentDiscount: 15,  // Store for display
  currentPeriodStart: new Date(subscription.current_period_start * 1000),
  currentPeriodEnd: new Date(subscription.current_period_end * 1000)
})
await dbSubscription.save()
```

### Querying Active Subscriptions for a Plan

```typescript
// Source: Existing codebase pattern from /server/api/payments/history.get.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const { planId } = getQuery(event)

  // Find active subscriptions for this plan
  const subscriptions = await Subscription.find({
    userId: user._id.toString(),
    planId: planId as string,
    status: { $in: ['active', 'past_due'] }  // Include grace period
  })
    .sort({ createdAt: -1 })
    .lean()

  return {
    success: true,
    data: subscriptions
  }
})
```

### Canceling Subscription at Period End

```typescript
// Source: Context7 - /stripe/stripe-node - Cancel subscription

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const { id } = getRouterParam(event, 'id')

  // Verify subscription belongs to user
  const subscription = await Subscription.findOne({
    _id: id,
    userId: user._id.toString()
  })

  if (!subscription) {
    throw createError({ statusCode: 404, statusMessage: 'Subscription not found' })
  }

  // Cancel in Stripe (at period end)
  const canceled = await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: true
    }
  )

  // Update database
  subscription.cancelAtPeriodEnd = true
  await subscription.save()

  return {
    success: true,
    data: {
      subscriptionId: subscription._id,
      cancelAt: new Date(canceled.cancel_at * 1000)
    }
  }
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payment Intents for recurring billing | Stripe Subscriptions API | 2014+ (Stripe Billing launch) | Subscriptions handle billing cycles, retries, dunning automatically |
| Manual discount calculation | Stripe Coupons with promotion codes | 2016+ | Centralized discount management, reusable codes, analytics |
| Webhooks without signature verification | Mandatory signature verification | 2018+ | Security best practice, prevents fraudulent events |
| Subscription data only in Stripe | Hybrid: Stripe + database sync | Current best practice | App resilience, faster queries, offline capability |

**Deprecated/outdated:**
- **Stripe Checkout for subscriptions (old flow):** Use Checkout Sessions or direct API with Payment Elements instead
- **Stripe Invoices without automatic tax:** Use Stripe Tax API for automatic tax calculation
- **Manual subscription state tracking:** Always use Stripe as source of truth, sync to database

## Open Questions

1. **Stripe Price IDs for QR reporting**
   - What we know: Need monthly and yearly prices for QR issue reporting subscription
   - What's unclear: Exact price amounts and whether to create prices now or in implementation phase
   - Recommendation: Create placeholder environment variables (`STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`, `STRIPE_ANNUAL_DISCOUNT_COUPON_ID`) and document price creation as first task in implementation

2. **Subscription-Plan relationship cardinality**
   - What we know: Each subscription is linked to a single plan via `planId`
   - What's unclear: Can a plan have multiple subscriptions (e.g., one for QR access, one for premium features)?
   - Recommendation: Start with one-active-subscription-per-plan constraint, relax to multiple in future if needed. Add unique index on `{ userId, planId, status: 'active' }` initially.

3. **Grace period for past_due subscriptions**
   - What we know: Stripe sets subscriptions to `past_due` when payment fails, retries for several days
   - What's unclear: How long should QR access continue during `past_due` status?
   - Recommendation: Treat `past_due` as active (allow access) for first 7 days, then revoke. Implement webhook listener for `invoice.payment_failed` to track days in `past_due` state.

4. **Annual discount percentage**
   - What we know: Requirements state 10-20% discount for annual prepayment
   - What's unclear: Exact discount percentage (10%, 15%, 20%?)
   - Recommendation: Use 15% as middle ground, store in environment variable (`ANNUAL_DISCOUNT_PERCENT`) for easy adjustment.

## Sources

### Primary (HIGH confidence)
- **[Stripe Node.js Library - /stripe/stripe-node](https://context7.com/stripe/stripe-node/llms.txt)** - Subscription creation, management, webhooks, pricing
- **[Official Stripe Documentation - Subscriptions](https://stripe.com/billing)** - Recurring payments and subscription solutions
- **[Official Stripe Documentation - Coupons](https://docs.stripe.com/billing/subscriptions/coupons)** - Coupon creation and application for annual discounts
- **[Codebase Analysis]** - Existing Payment.ts, Invoice.ts, Planes.ts models and API patterns

### Secondary (MEDIUM confidence)
- **[Stripe SCA Best Practices for Recurring Revenue](https://stripe.com/guides/sca-best-practices-for-recurring-revenue)** - First subscription charges, authentication
- **[Stripe Best Practices for SaaS Billing](https://stripe.com/resources/more/best-practices-for-saas-billing)** - Implementation guidance
- **[Mongoose Schema for Subscription App - Stack Overflow](https://stackoverflow.com/questions/44600205/improving-mongoose-schema-for-course-subscription-app)** - Schema design patterns
- **[Adding, Managing, and Keeping Track of Subscription Payments - Medium](https://medium.com/saasbase/adding-managing-and-keeping-track-of-subscription-payments-using-stripe-and-mongo-for-your-saas-d67e42a02abf)** - Complete subscription system guide

### Tertiary (LOW confidence)
- **[Best Payment APIs for Developers in 2026](https://blog.postman.com/best-payment-apis-for-developers/)** - Lists Stripe among top 2026 APIs (general verification)
- **[Stripe Billing Review 2026](https://research.com/software/reviews/stripe-billing)** - Recent Stripe Billing review (feature verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json, official documentation confirms capabilities
- Architecture: HIGH - Based on existing codebase patterns (Payment, Invoice models) and official Stripe documentation
- Pitfalls: HIGH - Verified against Stripe documentation, common issues documented in Stripe guides

**Research date:** 2025-01-25
**Valid until:** 2025-03-01 (60 days - Stripe API is stable but check for major updates before implementation)
