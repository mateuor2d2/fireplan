# Phase 08: Webhook Infrastructure - Research

**Researched:** 2026-01-26
**Domain:** Stripe webhook implementation with signature verification and idempotency
**Confidence:** HIGH

## Summary

Phase 08 requires implementing Stripe webhook handlers for payment and subscription lifecycle events. The research confirms that **webhook signature verification is mandatory** for security, and **idempotency must be implemented at the database level** to handle duplicate webhook deliveries gracefully.

The project already has:
- Existing webhook endpoint at `/server/api/payments/webhook.post.ts` with partial implementation
- Stripe SDK initialized with `stripe.webhooks.constructEvent()` for signature verification
- Payment and Subscription models with appropriate indexes
- Stripe helper utilities for subscription management

**Key gaps identified:**
1. Missing `/api/webhooks/stripe` endpoint (requirement WEB-01)
2. Current webhook lacks comprehensive event handlers for subscriptions (WEB-05, WEB-06, WEB-07, WEB-08)
3. No idempotency handling for duplicate events (WEB-03)
4. No webhook event logging model (WEB-04)
5. Missing event handlers for `checkout.session.completed`, subscription lifecycle, and invoice events

**Primary recommendation:** Create a new `/api/webhooks/stripe` endpoint with signature verification, comprehensive event handlers, database-level idempotency using a WebhookEvent model, and structured logging for all webhook activity.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Stripe Node SDK | Latest (v19+) | Webhook signature verification and event handling | Official Stripe SDK with built-in `constructEvent()` for secure signature validation |
| Nitro (Nuxt server) | Built-in to Nuxt 3/4 | Server routes and raw body parsing | Provides `readRawBody()` for accessing raw request body needed for signature verification |
| Mongoose | Existing (project uses) | Idempotency tracking and event logging | Database-backed event tracking prevents duplicate processing |
| Zod | Existing (project uses) | Request validation | Consistent validation pattern used across all API endpoints |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| winston | Not yet installed | Structured logging for webhook events | Production logging with levels, timestamps, and log rotation |
| p-limit | Not yet installed | Rate limiting webhook event processing | Prevent overwhelming downstream services during event spikes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Database-backed idempotency | Redis-based idempotency | Redis is faster but adds infrastructure complexity. Database is sufficient for webhook volume and simpler to operate. |
| Single webhook endpoint | Multiple webhook endpoints | Multiple endpoints (e.g., `/webhooks/payments`, `/webhooks/subscriptions`) complicate Stripe dashboard configuration. Single endpoint with event routing is simpler. |
| WebhookEvent model for logging | External logging service | External service (Datadog, LogRocket) provides better observability but adds cost. Mongoose model is sufficient for initial implementation. |

**Installation:**
```bash
# No new packages required for MVP
# Optional: For production-grade logging
bun add winston
# Optional: For rate limiting
bun add p-limit
```

## Architecture Patterns

### Recommended Project Structure

```
server/
├── api/
│   └── webhooks/
│       └── stripe.post.ts        # Main webhook endpoint (NEW)
├── models/
│   └── WebhookEvent.ts           # Event logging and idempotency (NEW)
├── utils/
│   └── webhookHandlers.ts        # Event handler functions (NEW)
└── types/
    └── webhook.ts                # Webhook event types (NEW)
```

### Pattern 1: Webhook Signature Verification with Nitro

**What:** Verify incoming webhook signatures using Stripe SDK's `constructEvent()` method.

**When to use:** Required for ALL webhook endpoints to prevent fraudulent requests.

**Why critical:** Stripe signs all webhook events with your webhook secret. Without verification, attackers can send fake events that trigger business logic (e.g., mark payments as succeeded without payment).

**Example:**
```typescript
// Source: /stripe/stripe-node Context7 docs + existing project code
import { stripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  // CRITICAL: Use readRawBody(), NOT readBody()
  // Signature verification requires exact raw body
  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!signature || !rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing signature or body'
    })
  }

  // Verify signature using webhook secret
  let stripeEvent
  try {
    const webhookSecret = useRuntimeConfig().stripeWebhookSecret
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid signature'
    })
  }

  // Process event...
  return { received: true }
})
```

**Key insight:** The raw body MUST be used exactly as received from Stripe. Any parsing or modification invalidates the signature.

### Pattern 2: Database-Backed Idempotency

**What:** Track processed webhook event IDs in MongoDB to prevent duplicate processing.

**When to use:** REQUIRED for all webhook handlers. Stripe guarantees "at least once" delivery, meaning duplicates WILL occur.

**Why critical:** Without idempotency, duplicate events can cause:
- Double-crediting user accounts
- Sending duplicate emails/notifications
- Corrupting database state

**Example:**
```typescript
// Source: WebSearch verified with Stripe docs (2025)
import { WebhookEvent } from '../../models/WebhookEvent'

async function processWebhookEvent(stripeEvent: Stripe.Event) {
  // Check if event was already processed
  const existing = await WebhookEvent.findOne({
    eventId: stripeEvent.id
  })

  if (existing) {
    console.log(`Event ${stripeEvent.id} already processed, skipping`)
    return
  }

  // Mark event as processing
  await WebhookEvent.create({
    eventId: stripeEvent.id,
    type: stripeEvent.type,
    status: 'processing',
    receivedAt: new Date()
  })

  try {
    // Process event (call appropriate handler)
    await handleEventByType(stripeEvent)

    // Mark as completed
    await WebhookEvent.updateOne(
      { eventId: stripeEvent.id },
      { status: 'completed', processedAt: new Date() }
    )
  } catch (error) {
    // Mark as failed
    await WebhookEvent.updateOne(
      { eventId: stripeEvent.id },
      {
        status: 'failed',
        error: error.message,
        processedAt: new Date()
      }
    )
    throw error
  }
}
```

**Key insight:** The `eventId` field is unique and indexed. MongoDB's unique constraint provides atomicity even with concurrent webhook deliveries.

### Pattern 3: Event Router with Type-Safe Handlers

**What:** Route events to appropriate handlers using a type-safe switch statement.

**When to use:** All webhook endpoints with multiple event types.

**Why helpful:** Provides clear separation of concerns and makes adding new event types straightforward.

**Example:**
```typescript
// Source: Context7 + existing project pattern
async function handleEventByType(stripeEvent: Stripe.Event) {
  switch (stripeEvent.type) {
    // One-time payment events
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(stripeEvent.data.object)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(stripeEvent.data.object)
      break

    // Subscription lifecycle events
    case 'customer.subscription.created':
      await handleSubscriptionCreated(stripeEvent.data.object)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(stripeEvent.data.object)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(stripeEvent.data.object)
      break

    // Invoice events
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(stripeEvent.data.object)
      break
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(stripeEvent.data.object)
      break

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`)
  }
}
```

### Pattern 4: Subscription Synchronization from Webhooks

**What:** Update local Subscription model based on Stripe subscription events.

**When to use:** For all subscription lifecycle events to keep database in sync with Stripe.

**Why critical:** Stripe is the source of truth for subscription state. Webhooks ensure your database reflects Stripe's actual state.

**Example:**
```typescript
// Source: Stripe subscription lifecycle docs (2025)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find local subscription record
  const localSub = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  })

  if (!localSub) {
    console.error(`Subscription ${subscription.id} not found in database`)
    return
  }

  // Update local subscription with Stripe data
  localSub.status = subscription.status
  localSub.currentPeriodStart = new Date(subscription.current_period_start * 1000)
  localSub.currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  localSub.cancelAtPeriodEnd = subscription.cancel_at_period_end

  // Handle paused subscriptions
  if (subscription.pause_collection) {
    localSub.status = 'paused'
  }

  await localSub.save()
}
```

### Anti-Patterns to Avoid

- **Parsing body before signature verification:** Always use `readRawBody()`. Parsing with `readBody()` modifies the body and breaks signature validation.
- **Returning errors for duplicate events:** Return 200 OK for already-processed events. Stripe interprets non-200 responses as failures and will retry.
- **Blocking webhook handlers:** Webhook handlers must respond quickly (<30 seconds). Long-running operations should be queued for background processing.
- **Silent event drops:** Always log unhandled event types. Silent drops make debugging difficult.
- **Trusting client-side metadata:** Never trust `metadata` from client-side requests. Webhook events should validate metadata against database state.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC verification | `stripe.webhooks.constructEvent()` | Stripe's SDK handles timestamp validation, tolerance checking, and timing attack prevention |
| Idempotency through in-memory sets | In-memory `Set` or `Map` | Database-backed tracking | In-memory state is lost on restart. Database provides durability and multi-instance safety. |
| Webhook retry logic | Custom exponential backoff | Stripe's automatic retries | Stripe automatically retries failed webhook deliveries (up to 3 days with exponential backoff). |
| Event type constants | Manual string typing | Stripe SDK's `Stripe.Event` type | TypeScript types provide autocomplete and compile-time safety. |
| Webhook testing with real Stripe | Manual testing in production | `stripe.webhooks.generateTestHeaderString()` | Generate test webhooks locally without touching Stripe's servers. |

**Key insight:** Stripe's webhooks are designed with "at least once" delivery. Your handlers MUST be idempotent, but you DON'T need to build retry logic—Stripe handles that.

## Common Pitfalls

### Pitfall 1: Using Parsed Body for Signature Verification

**What goes wrong:** Signature verification fails because the body was parsed before verification.

**Why it happens:** Nuxt's default `readBody()` parses JSON, which changes the body's string representation and invalidates the cryptographic signature.

**How to avoid:**
- ALWAYS use `readRawBody(event)` for webhook endpoints
- NEVER use `readBody(event)` before signature verification
- Only parse the body AFTER successful signature verification

**Warning signs:**
- "Signature verification failed" errors in logs
- Webhook endpoint works in development but fails in production

**Correct pattern:**
```typescript
const rawBody = await readRawBody(event)  // ✅ Use this first
const signature = getHeader(event, 'stripe-signature')

const event = stripe.webhooks.constructEvent(rawBody, signature, secret)

// Now safe to parse
const parsedEvent = JSON.parse(rawBody)
```

### Pitfall 2: Returning Non-200 for Duplicate Events

**What goes wrong:** Stripe retries already-processed events indefinitely, creating duplicate processing loops.

**Why it happens:** Developers think returning 400 or 409 for duplicates prevents reprocessing. Stripe interprets any non-200 as a failure and retries.

**How to avoid:**
- ALWAYS return 200 OK for successfully processed events (including idempotent duplicates)
- Use database tracking to detect duplicates before processing
- Log duplicate events for monitoring without returning errors

**Warning signs:**
- Same event ID appearing repeatedly in logs
- "Event already processed" logs with non-200 responses

**Correct pattern:**
```typescript
const existing = await WebhookEvent.findOne({ eventId: stripeEvent.id })

if (existing && existing.status === 'completed') {
  console.log(`Duplicate event ${stripeEvent.id}, returning 200`)
  return { received: true, duplicate: true }  // ✅ Return 200
}

// Process new event...
```

### Pitfall 3: Blocking Webhook Handlers

**What goes wrong:** Webhook endpoint times out because handlers perform long-running operations (e.g., PDF generation, email sending).

**Why it happens:** Developers put business logic directly in webhook handlers without considering execution time.

**How to avoid:**
- Keep webhook handlers under 5 seconds
- Queue long-running operations for background processing
- Return 200 OK quickly after recording the event

**Warning signs:**
- 504 Gateway Timeout errors in Stripe dashboard
- Users experience delays after payments

**Correct pattern:**
```typescript
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Quick database update
  await Payment.findOneAndUpdate(
    { stripePaymentIntentId: session.payment_intent },
    { status: 'succeeded' }
  )

  // Queue background tasks (don't await)
  generatePdfAsync(session.metadata.planId)
  sendEmailAsync(session.customer_email)

  // Return immediately
  return
}
```

### Pitfall 4: Missing Invoice Event Handlers

**What goes wrong:** Subscription payments succeed but local database isn't updated, causing access revocation.

**Why it happens:** Developers only handle `customer.subscription.*` events but miss `invoice.payment_*` events which fire for recurring subscription payments.

**How to avoid:**
- Handle BOTH subscription lifecycle events AND invoice payment events
- Use `invoice.payment_succeeded` to extend access for successful recurring payments
- Use `invoice.payment_failed` to handle payment failures and dunning

**Warning signs:**
- Users lose access after first subscription payment
- Subscription status shows "active" but `canPrint` is false

**Correct pattern:**
```typescript
case 'invoice.payment_succeeded':
  await handleInvoicePaymentSucceeded(invoice)
  break

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Extend access for subscription period
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription
  })

  if (subscription) {
    await Planes.findByIdAndUpdate(subscription.planId, {
      canPrint: true,
      subscriptionValidUntil: new Date(invoice.period_end * 1000)
    })
  }
}
```

### Pitfall 5: Ignoring Webhook Logging

**What goes wrong:** Debugging webhook issues is impossible because there's no record of received events.

**Why it happens:** Developers assume Stripe's dashboard provides sufficient logging, but local logs are needed for debugging business logic errors.

**How to avoid:**
- Log ALL webhook events to database before processing
- Include event ID, type, received timestamp, and processing status
- Store error messages and stack traces for failed events

**Warning signs:**
- "Why didn't this webhook work?" questions without answers
- No visibility into webhook processing failures

**Correct pattern:**
```typescript
await WebhookEvent.create({
  eventId: stripeEvent.id,
  type: stripeEvent.type,
  data: stripeEvent.data,
  status: 'pending',
  receivedAt: new Date()
})
```

## Code Examples

Verified patterns from official sources:

### Webhook Event Logging Model

```typescript
// Source: Mongoose patterns + project conventions
import { Schema, model } from 'mongoose'

export interface IWebhookEvent {
  _id: string
  eventId: string           // Stripe event ID (unique)
  type: string             // Event type (e.g., 'payment_intent.succeeded')
  status: 'pending' | 'processing' | 'completed' | 'failed'
  data: any                // Full event data for debugging
  error?: string           // Error message if failed
  receivedAt: Date
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId: {
    type: String,
    required: true,
    unique: true,
    description: 'Stripe event ID for idempotency'
  },
  type: {
    type: String,
    required: true,
    index: true,
    description: 'Event type for filtering and analysis'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
    description: 'Full event payload for debugging'
  },
  error: String,
  receivedAt: {
    type: Date,
    required: true,
    index: true
  },
  processedAt: Date
}, {
  timestamps: true
})

// Compound index for querying recent events by type
WebhookEventSchema.index({ type: 1, receivedAt: -1 })

// Index for cleanup of old events (optional)
WebhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }) // 30 days

export const WebhookEvent = model<IWebhookEvent>('WebhookEvent', WebhookEventSchema)
```

### Checkout Session Completed Handler

```typescript
// Source: Stripe checkout docs + project payment patterns
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Extract metadata
  const { userId, planId } = session.metadata || {}
  if (!userId || !planId) {
    throw new Error('Missing userId or planId in session metadata')
  }

  // Update payment record
  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: session.payment_intent as string },
    {
      status: 'succeeded',
      paymentMethod: 'checkout',
      description: session.description || 'Checkout session payment'
    }
  )

  if (!payment) {
    console.error(`Payment not found for session ${session.id}`)
    return
  }

  // Update plan access
  await Planes.findByIdAndUpdate(planId, {
    paymentStatus: 'paid',
    paidAt: new Date(),
    canPrint: true
  })

  // Send SSE notification for real-time UI update
  sseManager.sendToUser(userId, 'payment_success', {
    paymentId: payment._id.toString(),
    planId,
    amount: payment.amount,
    timestamp: new Date().toISOString()
  })

  console.log(`Checkout session ${session.id} processed successfully`)
}
```

### Subscription Created Handler

```typescript
// Source: Stripe subscription lifecycle docs (2025)
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Extract metadata from subscription
  const { planId, userId } = subscription.metadata || {}
  if (!planId || !userId) {
    console.error('Missing metadata in subscription', subscription.id)
    return
  }

  // Check if subscription already exists (idempotency)
  const existing = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  })

  if (existing) {
    console.log(`Subscription ${subscription.id} already exists`)
    return
  }

  // Create local subscription record
  await Subscription.create({
    userId,
    planId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    stripePriceId: subscription.items.data[0].price.id,
    status: subscription.status,
    billingInterval: subscription.items.data[0].recurring.interval,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: subscription.items.data[0].price.unit_amount || 0,
    currency: subscription.currency,
    metadata: subscription.metadata
  })

  // Update plan to enable QR access
  await Planes.findByIdAndUpdate(planId, {
    qrEnabled: true,
    subscriptionActive: true
  })

  console.log(`Subscription ${subscription.id} created and synced`)
}
```

### Invoice Payment Failed Handler

```typescript
// Source: Stripe invoice docs + project patterns
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Find subscription
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription as string
  })

  if (!subscription) {
    console.error(`Subscription not found for invoice ${invoice.id}`)
    return
  }

  // Update subscription status
  subscription.status = 'past_due'
  await subscription.save()

  // Update plan to disable QR access (or keep during dunning period)
  await Planes.findByIdAndUpdate(subscription.planId, {
    subscriptionStatus: 'past_due',
    subscriptionValidUntil: new Date() // Access ends now
  })

  // Notify user of payment failure
  sseManager.sendToUser(subscription.userId, 'subscription_payment_failed', {
    subscriptionId: subscription._id.toString(),
    planId: subscription.planId,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    nextRetry: invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null
  })

  console.log(`Invoice ${invoice.id} payment failed, subscription marked past_due`)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side payment confirmation | Webhook-based payment confirmation | 2019 | Webhooks are the source of truth. Client-side confirmation is unreliable. |
| Manual signature verification | `stripe.webhooks.constructEvent()` | 2017 (SDK v5+) | SDK handles timestamp validation, tolerance, and timing attacks automatically. |
| In-memory idempotency | Database-backed event tracking | Always recommended | Database provides durability across restarts and multi-instance deployments. |
| Single-threaded webhook processing | Concurrent processing with idempotency | 2021+ | Database locks allow concurrent webhook delivery without race conditions. |

**Deprecated/outdated:**
- **Trusting client-side payment success:** Client-side callbacks can be spoofed. Always wait for webhook confirmation.
- **Using payment_intent.succeeded for subscriptions:** For subscriptions, use `invoice.payment_succeeded` to handle recurring payments correctly.
- **Returning 400/409 for duplicate events:** Stripe retries non-200 responses. Return 200 OK for duplicates.
- **Manual HMAC signature verification:** Stripe SDK's `constructEvent()` is more secure and handles edge cases.

## Open Questions

Things that couldn't be fully resolved:

1. **Webhook event retention period**
   - What we know: Stripe doesn't specify retention requirements
   - What's unclear: How long to keep WebhookEvent records (30 days? 90 days? Forever?)
   - Recommendation: Implement 30-day TTL index initially, extend based on debugging needs. Most webhook events are only relevant for short-term debugging.

2. **Background job queue for long-running operations**
   - What we know: Webhook handlers must return quickly (<30s)
   - What's unclear: Whether to use BullMQ, Bull, or simple job queues
   - Recommendation: For MVP, use `setImmediate()` for non-critical tasks (PDF generation, emails). Consider BullMQ in Phase 10+ if job processing becomes complex.

3. **Webhook monitoring and alerting**
   - What we know: Failed webhooks should be logged
   - What's unclear: Whether to implement real-time alerts (e.g., Sentry, Datadog)
   - Recommendation: Implement database logging first (WEB-04). Add external monitoring in Phase 10+ based on operational needs.

## Sources

### Primary (HIGH confidence)
- **[/stripe/stripe-node](https://context7.com/stripe/stripe-node/llms.txt)** - Webhook signature verification, event handling, error handling, idempotency patterns
- **[Stripe Official Docs - Using webhooks with subscriptions](https://docs.stripe.com/billing/subscriptions/webhooks)** - Subscription lifecycle events and handlers
- **[Stripe Official Docs - Receive Stripe events](https://docs.stripe.com/webhooks)** - Core webhook implementation guide
- **[Existing project code](/home/mateu/NuxtsProjects/v9PLANESN4BUI4/server/api/payments/webhook.post.ts)** - Current webhook implementation with signature verification

### Secondary (MEDIUM confidence)
- **[Stripe Webhooks: Complete Guide (Nov 28, 2025)](https://www.magicbell.com/blog/stripe-webhooks-guide)** - Idempotency patterns and async processing
- **[Stripe Webhooks Implementation Guide (Sept 25, 2025)](https://www.hooklistener.com/learn/stripe-webhooks-implementation)** - Idempotency implementation with code examples
- **[Stripe Guide: Billing lifecycle management (Feb 10, 2025)](https://www.flycode.com/blog/stripe-guide-manage-stripe-billing-lifecycle-and-reporting)** - Subscription lifecycle best practices
- **[Stop Doing Business Logic in Webhook Endpoints (Oct 30, 2025)](https://dev.to/elvissautet/stop-doing-business-logic-in-webhook-endpoints-i-dont-care-what-your-lead-engineer-says-8o0)** - Idempotency and duplicate handling
- **[Stripe Payments in Nuxt 4 (Dec 14, 2025)](https://www.djamware.com/post/693eb332b00ad03314a098d2/stripe-payments-in-nuxt-4-with-server-routes-and-webhooks)** - Nuxt/Nitro raw body parsing with `readRawBody()`

### Tertiary (LOW confidence)
- **[How Stripe Prevents Double Payments (Aug 29, 2025)](https://singhajit.com/how-stripe-prevents-double-payment/)** - Idempotency key information
- **[Stripe Webhooks: Solving Race Conditions (Nov 6, 2024)](https://www.pedroalonso.net/blog/stripe-webhooks-deep-dive)** - Race condition handling in webhooks

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified with Context7 and official Stripe documentation
- Architecture: HIGH - Verified with official Stripe docs and existing project code
- Pitfalls: HIGH - Based on official Stripe best practices and community discussions (2025)

**Research date:** 2026-01-26
**Valid until:** 2026-02-25 (30 days - Stripe webhooks are stable, but SDK updates may occur)
