# Stripe Integration Pitfalls: Nuxt 3/4 + MongoDB SaaS

**Researched:** 2026-01-25
**Domain:** Stripe Checkout + Subscription integration for existing Nuxt 3/4 SaaS
**Confidence:** HIGH

## Executive Summary

Adding Stripe Checkout and subscriptions to an existing Nuxt 3/4 + MongoDB SaaS introduces specific pitfalls around payment enforcement, webhook reliability, state synchronization, and SSR compatibility. The most critical risks are payment bypass vulnerabilities, webhook race conditions, and subscription state drift between Stripe and MongoDB.

**Primary recommendation:** Implement defense-in-depth with webhook signature verification, idempotency handling, and server-side payment enforcement before any resource access.

---

## Critical Pitfalls (Payment Security)

### Pitfall 1: Payment Bypass via Client-Side Manipulation

**What goes wrong:** Users manipulate frontend state or API responses to bypass payment and access paid features for free.

**Why it happens:**
- Trusting client-side payment status
- Exposing "paid" flags in API responses without verification
- Frontend-only checks before granting access
- Missing server-side payment validation

**Warning signs:**
- Users accessing paid features without payment records
- Inconsistencies between `canPrint` flags and Payment collection
- API endpoints returning full plan objects including `paymentStatus: 'paid'`
- Client-side conditional rendering based on payment state

**How to avoid:**
```typescript
// ❌ WRONG: Client-side only check
const canAccessPlan = computed(() => plan.value.paymentStatus === 'paid')

// ✅ CORRECT: Server-side middleware check
export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  const plan = await Planes.findById(event.context.params.id)

  // ALWAYS verify payment server-side
  const payment = await Payment.findOne({
    planId: plan._id,
    userId: user._id,
    status: 'succeeded'
  })

  if (!payment && plan.paymentStatus !== 'paid') {
    throw createError({ statusCode: 402, message: 'Payment required' })
  }

  // Proceed with resource access
})
```

**Prevention strategy:**
1. **Server-side payment verification** on every protected endpoint
2. **Never trust client-side state** for payment decisions
3. **Use Nitro middleware** for consistent payment checks
4. **Implement payment-enforced guards** on sensitive operations (PDF generation, QR access)

**Phase to address:** Database + API (before exposing any payment-gated features)

**Testing approach:**
```bash
# Test 1: Try accessing protected endpoint with forged payment status
curl -X GET /api/planes/[id]/generate-pdf \
  -H "Authorization: Bearer [valid_token]" \
  # Should fail if payment not verified

# Test 2: Manipulate client-side state
# In browser dev tools: plan.paymentStatus = 'paid'
# Try accessing paid features - should fail server-side
```

---

### Pitfall 2: Webhook Signature Verification Bypass

**What goes wrong:** Attackers send fake webhook events to mark payments as complete without actual payment.

**Why it happens:**
- Missing `Stripe-Signature` header verification
- Using wrong webhook secret (test vs production)
- Framework body parsing breaking signature verification
- Not verifying signatures at all

**Warning signs:**
- Webhook endpoint accepts POST without signature check
- Payment status updates without corresponding Stripe events
- Sudden influx of "successful" payments from unknown users
- Webhook handler logs show "Invalid signature" but continues processing

**How to avoid:**
```typescript
// ❌ WRONG: No signature verification
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const stripeEvent = JSON.parse(body) // DANGER: Unverified
  // Process event...
})

// ✅ CORRECT: Always verify signature
export default defineEventHandler(async (event) => {
  const body = await readRawBody(event) // MUST use raw body
  const signature = getHeader(event, 'stripe-signature')

  if (!signature || !body) {
    throw createError({ statusCode: 400, message: 'Missing signature' })
  }

  let stripeEvent
  try {
    const webhookSecret = useRuntimeConfig().stripeWebhookSecret
    stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    throw createError({ statusCode: 400, message: 'Invalid signature' })
  }

  // Now safe to process event
})
```

**Prevention strategy:**
1. **Always use `readRawBody()`** - body parsing breaks signatures
2. **Verify signature FIRST** - before any other logic
3. **Separate webhook secrets** for test vs production
4. **Log all verification failures** for security monitoring
5. **Use HTTPS only** in production

**Phase to address:** Webhook (first line of defense)

**Testing approach:**
```bash
# Test 1: Send webhook without signature
curl -X POST /api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "payment_intent.succeeded", "data": {...}}' \
  # Should return 400 Invalid signature

# Test 2: Send webhook with fake signature
curl -X POST /api/payments/webhook \
  -H "Stripe-Signature: fake_signature" \
  -d '...' \
  # Should return 400

# Test 3: Use Stripe CLI to test valid webhooks
stripe listen --forward-to localhost:3000/api/payments/webhook
stripe trigger payment_intent.succeeded
```

**Sources:**
- [Stripe Webhook Signature Verification](https://docs.stripe.com/webhooks) (HIGH confidence)
- [Missing Stripe-Signature Verification - GitHub Security Advisory](https://github.com/n8n-io/n8n/security/advisories/GHSA-jf52-3f2h-h9j5) (HIGH confidence)
- [Bypassing Payments Using Webhooks](https://cablej.io/blog/bypassing-payments-using-webhooks/) (MEDIUM confidence)

---

## State Synchronization Pitfalls

### Pitfall 3: Webhook Race Conditions Causing State Inconsistency

**What goes wrong:** Multiple webhooks arrive out of order or simultaneously, causing subscription/payment state to flicker or become inconsistent.

**Why it happens:**
- Webhooks don't guarantee ordering
- `payment_intent.succeeded` arrives before `checkout.session.completed`
- Concurrent webhook processing writes to same documents
- No idempotency handling for duplicate events

**Warning signs:**
- Payment status flickers between `pending` → `succeeded` → `pending`
- Plan `paymentStatus` doesn't match Payment collection status
- "Subscription already active" errors in logs
- Duplicate payment records for same Stripe payment intent

**How to avoid:**
```typescript
// ❌ WRONG: No idempotency, assumes ordered events
async function handlePaymentSuccess(paymentIntent: any) {
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id
  })

  // Always updates, even if already processed
  payment.status = 'succeeded'
  await payment.save()

  await Planes.findByIdAndUpdate(payment.planId, {
    paymentStatus: 'paid'
  })
}

// ✅ CORRECT: Idempotent with state checks
async function handlePaymentSuccess(paymentIntent: any) {
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id
  })

  if (!payment) {
    console.warn('Payment not found, might be processed already')
    return // Don't create duplicate
  }

  // Check if already processed (idempotency)
  if (payment.status === 'succeeded') {
    console.log('Payment already succeeded, skipping')
    return
  }

  // Use atomic update to prevent race conditions
  const updatedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: { $ne: 'succeeded' } // Only update if not already succeeded
    },
    {
      status: 'succeeded',
      paymentMethod: paymentIntent.payment_method
    },
    { new: true }
  )

  if (!updatedPayment) {
    console.log('Payment was already updated by another webhook, skipping')
    return
  }

  // Update plan atomically
  await Planes.findOneAndUpdate(
    {
      _id: payment.planId,
      paymentStatus: { $ne: 'paid' } // Only update if not already paid
    },
    {
      paymentStatus: 'paid',
      paidAt: new Date(),
      canPrint: true
    }
  )
}
```

**Prevention strategy:**
1. **Store processed event IDs** to detect duplicates
2. **Use atomic updates** (`findOneAndUpdate` with conditions)
3. **Check current state** before applying updates
4. **Design for out-of-order events** - handle any event in any order
5. **Implement idempotency keys** for Stripe API calls

**Phase to address:** Webhook + Database

**Testing approach:**
```typescript
// Test 1: Send same webhook twice
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.succeeded
// Should only process once

// Test 2: Send events out of order
// 1. Send payment_intent.succeeded
// 2. Send payment_intent.canceled
// Verify final state is correct

// Test 3: Concurrent webhooks
// Use Stripe CLI to send multiple events simultaneously
// Monitor for race conditions in logs
```

**Sources:**
- [The Race Condition You're Probably Shipping Right Now with Stripe Webhooks](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4) (HIGH confidence)
- [Billing Webhook Race Condition Solution Guide](https://excessivecoding.com/blog/billing-webhook-race-condition-solution-guide) (MEDIUM confidence)
- [Stripe Firebase Extensions - Race Condition Issue](https://github.com/invertase/stripe-firebase-extensions/issues/119) (MEDIUM confidence)

---

### Pitfall 4: Subscription State Drift Between Stripe and MongoDB

**What goes wrong:** MongoDB subscription status becomes inconsistent with Stripe, leading to either granting free access or blocking paid users.

**Why it happens:**
- Webhook failures not handled properly
- Manual Stripe Dashboard updates not synced to DB
- Eventual consistency between systems
- No reconciliation mechanism
- Webhook processing errors not retried

**Warning signs:**
- Subscription shows `active` in Stripe but `past_due` in MongoDB
- Users complain about being blocked despite valid subscription
- Dashboard shows different counts than Stripe Dashboard
- "Subscription not found" errors for valid Stripe subscriptions

**How to avoid:**
```typescript
// ✅ CORRECT: Implement reconciliation mechanism
async function reconcileSubscriptionState(userId: string, planId: string) {
  // 1. Get local state
  const localPayment = await Payment.findOne({ userId, planId })
  const localPlan = await Planes.findById(planId)

  // 2. Get Stripe source of truth
  let stripeState
  if (localPayment?.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(
      localPayment.stripeSubscriptionId
    )
    stripeState = {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    }
  } else if (localPayment?.stripePaymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      localPayment.stripePaymentIntentId
    )
    stripeState = {
      status: paymentIntent.status === 'succeeded' ? 'paid' : 'unpaid'
    }
  }

  // 3. Compare and sync if needed
  if (stripeState.status !== localPayment?.status) {
    console.log(`State drift detected for payment ${localPayment?._id}`)
    console.log(`Local: ${localPayment?.status}, Stripe: ${stripeState.status}`)

    // Update local state to match Stripe
    await Payment.findByIdAndUpdate(localPayment!._id, {
      status: stripeState.status
    })

    // Update plan accordingly
    const planStatus = stripeState.status === 'succeeded' ||
                       stripeState.status === 'active' ||
                       stripeState.status === 'paid'
      ? 'paid'
      : 'unpaid'

    await Planes.findByIdAndUpdate(planId, {
      paymentStatus: planStatus,
      canPrint: planStatus === 'paid'
    })

    console.log(`Reconciled payment ${localPayment?._id} to Stripe state`)
  }
}

// Run reconciliation periodically or on suspicious activity
// Example: Every 5 minutes via cron
// Example: When user reports access issues
```

**Prevention strategy:**
1. **Implement periodic reconciliation** (cron job every 5-15 minutes)
2. **Add "Sync with Stripe"** admin button for manual reconciliation
3. **Log webhook processing failures** for investigation
4. **Use Stripe as source of truth** - when in doubt, query Stripe API
5. **Set up alerts** for state inconsistencies

**Phase to address:** Webhook + Admin Dashboard

**Testing approach:**
```typescript
// Test 1: Manually update subscription in Stripe Dashboard
// Wait for reconciliation to sync changes

// Test 2: Simulate webhook failure
// Block webhook endpoint temporarily
// Update subscription in Stripe
// Unblock and verify reconciliation catches up

// Test 3: Create state drift manually
// Update MongoDB to 'past_due'
// Run reconciliation
// Verify it syncs to Stripe state
```

**Sources:**
- [Finding and Fixing Eventual Consistency with Stripe Events](https://blog.sequin.io/finding-and-fixing-eventual-consistency-with-stripe-events/) (HIGH confidence)
- [Beyond Basic Sync: Database Reconciliation](https://stripe.dev/blog/database-reconciliation-growing-businesses-part-2) (HIGH confidence)

---

## Nuxt 3/4 Specific Pitfalls

### Pitfall 5: SSR Hydration Mismatch with Stripe.js

**What goes wrong:** Stripe.js loads differently on server vs client, causing hydration mismatches and checkout failures.

**Why it happens:**
- Stripe.js only works in browser
- Server-rendered HTML doesn't match client-rendered Stripe elements
- Nuxt SSR attempts to render Stripe.js on server
- Missing `ClientOnly` wrapper for Stripe components

**Warning signs:**
- Console errors: "Hydration mismatch" or "Stripe is not defined"
- Checkout button works on client navigation but fails on refresh
- White flashes or layout shifts when Stripe loads
- "window is not defined" errors during SSR

**How to avoid:**
```vue
<!-- ❌ WRONG: Renders Stripe on server -->
<template>
  <div>
    <stripe-checkout :session-id="sessionId" />
  </div>
</template>

<!-- ✅ CORRECT: ClientOnly wrapper -->
<template>
  <div>
    <ClientOnly>
      <stripe-checkout :session-id="sessionId" />
      <template #fallback>
        <UButton loading>Loading checkout...</UButton>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Load Stripe.js only on client
const stripe = ref(null)

onMounted(async () => {
  const { loadStripe } = await import('@stripe/stripe-js')
  stripe.value = await loadStripe(runtimeConfig.public.stripePublishableKey)
})
</script>
```

**Prevention strategy:**
1. **Always use `<ClientOnly>`** for Stripe.js components
2. **Load Stripe.js in `onMounted`** - not in component setup
3. **Provide loading fallbacks** to prevent layout shift
4. **Use Nuxt plugins** for Stripe initialization (client-only)
5. **Test checkout on page refresh** - not just navigation

**Phase to address:** Frontend (before Stripe integration testing)

**Testing approach:**
```bash
# Test 1: Hard refresh on checkout page
# Should see loading state, then Stripe checkout

# Test 2: Navigate to checkout via router
# Should work without hydration errors

# Test 3: Check console for hydration warnings
# Should be clean

# Test 4: SSR build test
npm run build
npm run preview
# Verify checkout works in production mode
```

**Sources:**
- [Nuxt 4 Hydration Best Practices](https://nuxt.com/docs/4.x/guide/best-practices/hydration) (HIGH confidence)
- [Stripe Checkout with SSR Support Issue](https://github.com/jofftiquez/vue-stripe-checkout/issues/72) (MEDIUM confidence)

---

### Pitfall 6: Nitro Route Handler Body Parsing Breaking Webhook Signatures

**What goes wrong:** Nitro's automatic body parsing modifies webhook payload, breaking Stripe signature verification.

**Why it happens:**
- Using `readBody()` instead of `readRawBody()`
- Nitro middleware modifying request body
- JSON parsing changing whitespace/formatting
- Body encoding issues

**Warning signs:**
- "Invalid signature" errors on valid webhooks
- Webhook verification works locally but fails in production
- Stripe Dashboard shows webhook signature verified, but app rejects it

**How to avoid:**
```typescript
// ❌ WRONG: readBody() parses and modifies payload
export default defineEventHandler(async (event) => {
  const body = await readBody(event) // PARSED - breaks signature
  const signature = getHeader(event, 'stripe-signature')

  stripeEvent = stripe.webhooks.constructEvent(
    JSON.stringify(body), // Re-stringifying won't match original
    signature,
    webhookSecret
  )
})

// ✅ CORRECT: readRawBody() gets original payload
export default defineEventHandler(async (event) => {
  const body = await readRawBody(event) // RAW - unmodified
  const signature = getHeader(event, 'stripe-signature')

  stripeEvent = stripe.webhooks.constructEvent(
    body,
    signature,
    webhookSecret
  )
})
```

**Prevention strategy:**
1. **Always use `readRawBody()`** for webhook endpoints
2. **Disable body parsing middleware** for webhook routes
3. **Never modify webhook payload** before verification
4. **Test signature verification** with real Stripe webhooks
5. **Log raw body length** to detect parsing issues

**Phase to address:** Webhook (critical for security)

**Testing approach:**
```bash
# Test 1: Use Stripe CLI to send real webhook
stripe listen --forward-to localhost:3000/api/payments/webhook
stripe trigger payment_intent.succeeded
# Should verify signature successfully

# Test 2: Check logs for body parsing
# Should see raw body length logged

# Test 3: Manually craft webhook with valid signature
# Use Stripe CLI to get test signature
# Verify it passes
```

---

## Testing & Development Pitfalls

### Pitfall 7: Testing Payment Flows with Real Money

**What goes wrong:** Developers accidentally trigger real payments during testing, wasting money and creating messy data.

**Why it happens:**
- Using live Stripe keys in development
- Forgetting to switch to test mode
- Test suite hitting real Stripe API
- Environment variables not properly configured

**Warning signs:**
- Real charges on Stripe Dashboard during dev
- Test data mixed with production data
- "This test mode endpoint does not support this operation" errors in production
- Unexpected email receipts during development

**How to avoid:**
```typescript
// ✅ CORRECT: Environment-aware Stripe initialization
// server/utils/stripe.ts
import Stripe from 'stripe'

const isTest = process.env.NODE_ENV !== 'production'

export const stripe = new Stripe(
  isTest
    ? process.env.STRIPE_SECRET_KEY_TEST!
    : process.env.STRIPE_SECRET_KEY!,
  {
    apiVersion: '2025-01-27' as any,
    typescript: true,
  }
)

// Add safety check in development
if (!isTest && !process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
  console.warn('⚠️  WARNING: Using test key in production!')
}

if (isTest && !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  console.warn('⚠️  WARNING: Using live key in development!')
  throw new Error('Refusing to use live Stripe key in development')
}

// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    public: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }
  }
})

// .env
STRIPE_SECRET_KEY=sk_test_...  # Test key in development
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Prevention strategy:**
1. **Environment variable validation** at startup
2. **Separate Stripe accounts** for test and production
3. **Use Stripe CLI** for local webhook testing
4. **Explicit test mode checks** before payments
5. **Production safeguards** (confirm dialogs for live payments)

**Phase to address:** Development Setup (before any payment code)

**Testing approach:**
```bash
# Test 1: Verify test mode in development
# Check that sk_test_ keys are used

# Test 2: Stripe CLI for local testing
stripe listen --forward-to localhost:3000/api/payments/webhook
stripe trigger payment_intent.succeeded

# Test 3: Test mode only operations
# All test payments should use test cards:
# 4242 4242 4242 4242 (success)
# 4000 0000 0000 0002 (card declined)
```

**Sources:**
- [How to Test Stripe Webhooks in 2025](https://www.webhookdebugger.com/blog/how-to-test-stripe-webhooks-complete-guide) (HIGH confidence)
- [Stripe Webhook - ngrok Documentation](https://ngrok.com/docs/integrations/webhooks/stripe-webhooks) (HIGH confidence)

---

### Pitfall 8: Missing Idempotency for Stripe API Calls

**What goes wrong:** Network retries or duplicate webhook events cause duplicate charges or subscriptions.

**Why it happens:**
- Not providing idempotency keys for Stripe API calls
- Retry logic creating duplicate PaymentIntents
- Network errors triggering automatic retries
- Webhook redeliveries processing same event twice

**Warning signs:**
- Multiple PaymentIntents for same purchase
- Duplicate subscriptions created
- Users charged twice for single purchase
- Stripe Dashboard shows duplicate identical charges

**How to avoid:**
```typescript
// ❌ WRONG: No idempotency key
const paymentIntent = await stripe.paymentIntents.create({
  amount: 9900,
  currency: 'eur'
})
// If network fails and retries, creates duplicate

// ✅ CORRECT: Idempotency key from session/plan ID
const paymentIntent = await stripe.paymentIntents.create({
  amount: 9900,
  currency: 'eur'
}, {
  idempotencyKey: `payment_${planId}_${userId}_${Date.now()}`
})

// Even better: Use stable idempotency key tied to business logic
// For per-plan payments, planId is unique per payment attempt
const paymentIntent = await stripe.paymentIntents.create({
  amount: 9900,
  currency: 'eur'
}, {
  idempotencyKey: `payment_plan_${planId}` // Same key = same payment intent
})

// For retries, keep same idempotency key
// For new payment attempts, use new key: `payment_plan_${planId}_retry_${retryCount}`
```

**Prevention strategy:**
1. **Generate idempotency keys** from business logic (planId, userId)
2. **Store idempotency keys** in database for retries
3. **Use unique keys** for each payment attempt
4. **Log idempotency key usage** for debugging
5. **Handle idempotency errors** gracefully

**Phase to address:** API + Database

**Testing approach:**
```typescript
// Test 1: Retry payment creation with same idempotency key
// Should return same PaymentIntent, not create duplicate

// Test 2: Create payment with different idempotency keys
// Should create separate PaymentIntents

// Test 3: Network failure simulation
// Trigger network error during payment creation
// Verify retry doesn't create duplicate charge
```

**Sources:**
- [Stripe Payment Intents API - Idempotency](https://docs.stripe.com/payments/payment-intents) (HIGH confidence)
- [How Stripe Prevents Double Payments](https://singhajit.com/how-stripe-prevents-double-payment/) (MEDIUM confidence)
- [Top 7 Webhook Reliability Tricks for Idempotency](https://medium.com/@kaushalsinh73/top-7-webhook-reliability-tricks-for-idempotency-a098f3ef5809) (MEDIUM confidence)

---

## Subscription-Specific Pitfalls

### Pitfall 9: Subscription Status Not Checked Before Access

**What goes wrong:** Users with `past_due` or `canceled` subscriptions still access paid features.

**Why it happens:**
- Only checking subscription exists, not its status
- Not handling `past_due`, `unpaid`, `canceled` states
- Caching subscription status too long
- Missing webhook handlers for status changes

**Warning signs:**
- Users access features after subscription expires
- No payment for months but subscription still active
- Stripe Dashboard shows `past_due` but app grants access
- Subscription status different in Stripe vs MongoDB

**How to avoid:**
```typescript
// ❌ WRONG: Only checks if subscription exists
const subscription = await Subscription.findOne({ userId })
if (subscription) {
  // Grants access regardless of status
  return allowAccess()
}

// ✅ CORRECT: Check specific allowed statuses
const subscription = await Subscription.findOne({ userId })
const activeStatuses = ['active', 'trialing']
const paidStatuses = ['succeeded', 'paid']

if (!subscription ||
    !activeStatuses.includes(subscription.status)) {

  // Double-check with Stripe (source of truth)
  const stripeSub = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId
  )

  if (!activeStatuses.includes(stripeSub.status)) {
    throw createError({
      statusCode: 402,
      message: 'Subscription not active'
    })
  }

  // Update local state
  subscription.status = stripeSub.status
  await subscription.save()
}

// For per-plan payments
const payment = await Payment.findOne({
  userId,
  planId,
  status: { $in: paidStatuses }
})

if (!payment) {
  throw createError({
    statusCode: 402,
    message: 'Payment required for this plan'
  })
}
```

**Prevention strategy:**
1. **Define valid subscription statuses** explicitly
2. **Check Stripe API** when local state is ambiguous
3. **Handle all webhook events** that change status
4. **Implement status caching** with short TTL (5 min max)
5. **Log access denials** for monitoring

**Phase to address:** API + Webhook

**Testing approach:**
```bash
# Test 1: Set subscription to past_due in Stripe
# Verify access is blocked

# Test 2: Cancel subscription
# Verify access is revoked immediately

# Test 3: Expire subscription
# Verify webhook updates local state
# Verify access is blocked
```

---

### Pitfall 10: Webhook Replay Attacks

**What goes wrong:** Attacker captures valid webhook and replays it later to re-activate expired subscriptions.

**Why it happens:**
- Not checking webhook timestamp
- No expiration on webhook signatures
- Processing old webhooks without validation
- Missing timestamp tolerance checks

**Warning signs:**
- Old webhooks successfully processing
- Subscriptions re-activating after expiration
- Webhook timestamps in logs are very old
- Duplicate webhook IDs being processed

**How to avoid:**
```typescript
// ❌ WRONG: No timestamp check
stripeEvent = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
// Processes event regardless of age

// ✅ CORRECT: Timestamp tolerance check
stripeEvent = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret,
  // Tolerance: Reject webhooks older than 5 minutes
  300 // Default, but explicit is better
)

// Additional defense: Check event creation time
const eventAge = Date.now() - (stripeEvent.created * 1000)
if (eventAge > 300000) { // 5 minutes
  console.warn(`Received old webhook event: ${stripeEvent.id}`)
  console.warn(`Event age: ${Math.round(eventAge / 1000)}s`)
  // Still process (Stripe might retry), but log for monitoring
}

// For especially sensitive operations, stricter check:
if (eventAge > 60000) { // 1 minute for payment successes
  if (stripeEvent.type === 'payment_intent.succeeded') {
    console.error('Rejecting old payment success event')
    throw createError({
      statusCode: 400,
      message: 'Event too old'
    })
  }
}
```

**Prevention strategy:**
1. **Enable timestamp tolerance** (default 5 min, reduce for sensitive ops)
2. **Log webhook ages** for monitoring
3. **Reject suspicious old events** for critical operations
4. **Use NTP-synced servers** for accurate time
5. **Monitor for replay patterns** in logs

**Phase to address:** Webhook (security hardening)

**Testing approach:**
```bash
# Test 1: Send old webhook with valid signature
# Should be rejected or logged as suspicious

# Test 2: Send current webhook
# Should process normally

# Test 3: Check Stripe Dashboard webhook timestamps
# Verify they match processing time
```

**Sources:**
- [Stripe Webhooks - Preventing Replay Attacks](https://docs.stripe.com/webhooks) (HIGH confidence - explicitly covers timestamp tolerance)

---

## MongoDB-Specific Considerations

### Pitfall 11: MongoDB Transaction Rollback Ignored

**What goes wrong:** Payment fails but MongoDB document updates aren't rolled back, leaving inconsistent state.

**Why it happens:**
- Not using MongoDB transactions for multi-document updates
- Payment + Plan + User updates not atomic
- Webhook processing errors leaving partial updates
- Missing rollback logic

**Warning signs:**
- Payment succeeded but Plan not marked paid
- User charged but subscription not created
- Orphaned Payment records without associated Plans
- Inconsistencies after webhook processing errors

**How to avoid:**
```typescript
// ❌ WRONG: No transaction, updates are independent
async function processPayment(paymentIntent: any) {
  await Payment.findByIdAndUpdate(paymentId, { status: 'succeeded' })
  // If this fails, payment is marked succeeded but plan not updated
  await Planes.findByIdAndUpdate(planId, { paymentStatus: 'paid' })
}

// ✅ CORRECT: Transaction for atomic multi-document updates
async function processPayment(paymentIntent: any) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Update payment
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: 'succeeded' },
      { session, new: true }
    )

    // Update plan
    const plan = await Planes.findByIdAndUpdate(
      planId,
      { paymentStatus: 'paid', canPrint: true },
      { session, new: true }
    )

    // Update user
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { paidPlans: planId } },
      { session }
    )

    // Commit transaction
    await session.commitTransaction()
    console.log('Payment processed successfully')

    return { payment, plan }
  } catch (error) {
    // Rollback on any error
    await session.abortTransaction()
    console.error('Payment processing failed, rolled back:', error)
    throw error
  } finally {
    session.endSession()
  }
}
```

**Prevention strategy:**
1. **Use MongoDB sessions** for multi-document updates
2. **Wrap webhook handlers** in transactions
3. **Implement proper rollback** logic
4. **Log transaction failures** for debugging
5. **Consider eventual consistency** for non-critical updates

**Phase to address:** Database + Webhook

**Testing approach:**
```typescript
// Test 1: Simulate failure mid-transaction
// Force error after payment update, before plan update
// Verify both rollback

// Test 2: Webhook processing error
// Trigger error in webhook handler
// Verify no partial updates

// Test 3: Transaction timeout
// Simulate long-running transaction
// Verify proper timeout handling
```

**Sources:**
- [MongoDB Transactions - Official Documentation](https://www.mongodb.com/docs/manual/core/transactions/) (HIGH confidence - MongoDB official docs)
- [Stripe's MongoDB Usage Patterns](https://stripe.com/blog/how-stripes-document-databases-supported-99.999-uptime-with-zero-downtime-data-migrations) (HIGH confidence - Stripe's own MongoDB implementation)

---

## Testing & Monitoring

### Recommended Testing Checklist

Before deploying Stripe integration:

- [ ] **Webhook signature verification** - Test with fake signatures
- [ ] **Idempotency** - Send same webhook twice
- [ ] **Payment bypass attempts** - Try accessing paid features without payment
- [ ] **State reconciliation** - Create drift, verify reconciliation fixes it
- [ ] **SSR compatibility** - Test checkout on page refresh
- [ ] **Race conditions** - Send concurrent webhooks
- [ ] **Subscription status checks** - Test with expired/canceled subscriptions
- [ ] **Webhook replay attacks** - Send old webhooks
- [ ] **MongoDB transactions** - Test rollback scenarios
- [ ] **Test mode isolation** - Verify no real payments in development

### Recommended Monitoring

Set up alerts for:

- **Webhook signature verification failures** - Potential attack
- **Payment status mismatches** - Stripe vs DB
- **Orphaned Payment records** - Without associated Plans
- **Subscription state drift** - Status mismatches
- **Old webhook processing** - Potential replay attack
- **Transaction failures** - Rollback scenarios
- **Unauthorized access attempts** - Payment bypass attempts

---

## Sources

### Primary (HIGH confidence)
- [Stripe Webhooks Official Documentation](https://docs.stripe.com/webhooks) - Webhook signature verification, replay attack prevention, event handling
- [Stripe Payment Intents API Documentation](https://docs.stripe.com/payments/payment-intents) - Idempotency, payment flow
- [Stripe Database Infrastructure Blog](https://stripe.com/blog/how-stripes-document-databases-supported-99.999-uptime-with-zero-downtime-data-migrations) - MongoDB patterns, data consistency
- [Nuxt 4 Hydration Best Practices](https://nuxt.com/docs/4.x/guide/best-practices/hydration) - SSR compatibility

### Secondary (MEDIUM confidence)
- [The Race Condition You're Probably Shipping Right Now with Stripe Webhooks](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4) - Webhook race conditions
- [Billing Webhook Race Condition Solution Guide](https://excessivecoding.com/blog/billing-webhook-race-condition-solution-guide) - Race condition patterns
- [Finding and Fixing Eventual Consistency with Stripe Events](https://blog.sequin.io/finding-and-fixing-eventual-consistency-with-stripe-events/) - State synchronization
- [Missing Stripe-Signature Verification - GitHub Security Advisory](https://github.com/n8n-io/n8n/security/advisories/GHSA-jf52-3f2h-h9j5) - Security vulnerability example
- [How to Test Stripe Webhooks in 2025](https://www.webhookdebugger.com/blog/how-to-test-stripe-webhooks-complete-guide) - Testing patterns
- [Top 7 Webhook Reliability Tricks for Idempotency](https://medium.com/@kaushalsinh73/top-7-webhook-reliability-tricks-for-idempotency-a098f3ef5809) - Idempotency patterns

### Tertiary (LOW confidence - needs validation)
- [Bypassing Payments Using Webhooks](https://cablej.io/blog/bypassing-payments-using-webhooks/) - Webhook vulnerabilities (older source, verify current Stripe protections)
- [Stripe Firebase Extensions - Race Condition Issue](https://github.com/invertase/stripe-firebase-extensions/issues/119) - Framework-specific but patterns apply

---

## Metadata

**Confidence breakdown:**
- Payment security pitfalls: HIGH - Based on official Stripe docs and security advisories
- State synchronization: HIGH - Verified with Stripe blog and official docs
- Nuxt 3/4 specifics: HIGH - Official Nuxt 4 docs and GitHub issues
- Testing patterns: MEDIUM - Community best practices, verify with your specific setup

**Research date:** 2026-01-25
**Valid until:** 2026-03-01 (Stripe updates webhooks regularly; Nuxt 4 is stable but evolving)

**Open questions:**
1. **Nuxt 4 specific Stripe module** - Does @nuxtjs/stripe module exist for Nuxt 4? (LOW confidence - verify before using)
2. **MongoDB transaction performance** - What's the performance impact of transactions on webhook processing? (MEDIUM confidence - needs testing)
3. **Webhook retry limits** - What's the optimal retry strategy for failed webhooks? (MEDIUM confidence - Stripe retries for 3 days, but app-level strategy unclear)

**Recommendations for validation:**
- Test webhook signature verification with both test and production webhooks
- Verify MongoDB transaction performance under load (100+ concurrent webhooks)
- Confirm Nuxt 4 + Stripe.js compatibility in production build
- Set up monitoring for all warning signs before launch
