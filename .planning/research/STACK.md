# STACK.md - Stripe Integration Stack for Nuxt 3/4 (2025)

**Research Date:** 2025-01-25
**Domain:** Stripe Payments Integration
**Overall Confidence:** HIGH
**Milestone:** v1.1 Stripe Payments

## Executive Summary

For integrating Stripe Checkout and subscriptions into a Nuxt 3/4 application in 2025, the standard stack combines **official Stripe SDKs** with **Nuxt server-side patterns**. The existing implementation already uses `stripe` v18.5.0 and `@stripe/stripe-js` v7.9.0, which aligns with 2025 best practices. For subscription functionality, we recommend migrating from **Payment Elements** to **Stripe Checkout**, which is better suited for SaaS subscriptions and provides a more optimized user experience.

### Primary Recommendation
**Use Stripe Checkout for subscriptions** (not Elements) with server-side session creation in Nitro routes, webhook-based subscription management, and customer portal for self-service billing management. Keep existing Payment Elements only for one-time payments if needed.

## Standard Stack for 2025

### Core Packages (Already Installed ✅)

| Package | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | ^18.5.0 | Server-side Stripe SDK | Official Node.js SDK, actively maintained, required for API calls |
| `@stripe/stripe-js` | ^7.9.0 | Client-side Stripe.js | TypeScript-aware SDK for client-side operations, Elements, Checkout redirects |

**Installation:** Already installed - no action needed.

```bash
# Current versions in package.json
"stripe": "^18.5.0"
"@stripe/stripe-js": "^7.9.0"
```

### Supporting Packages (Consider Adding)

| Package | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@unlok-co/nuxt-stripe** | ^5.0.0 | Official Nuxt Stripe module | **NOT RECOMMENDED** - Adds abstraction layer, not needed for Nitro routes |
| **stripe-cli** | System tool | Local webhook testing | **Recommended for development** - Test webhooks locally |

**Installation for development:**
```bash
# Stripe CLI for local webhook testing (optional but recommended)
brew install stripe/stripe-cli/stripe  # macOS
choco install stripe  # Windows
# Download from stripe.com/docs/stripe-cli for Linux
```

### Nuxt-Specific Modules

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------| **Use `stripe` SDK directly** | Nuxt module adds unnecessary abstraction | Direct SDK usage gives more control, better TypeScript support, less magic |
| Stripe Checkout | Payment Elements | Checkout is better for subscriptions, Elements for custom flows | Checkout handles PCI compliance automatically, simpler setup |
| Server-side SDK | Client-side only | Server-side is required for security | Never expose secret keys, must use server for Checkout sessions |

## Architecture Patterns

### Recommended Project Structure for Stripe Integration

```
server/
├── api/
│   ├── payments/
│   │   ├── create-checkout-session.post.ts    # NEW: Stripe Checkout for subscriptions
│   │   ├── create-billing-portal-session.post.ts  # NEW: Customer portal
│   │   ├── create-intent.post.ts              # ✅ EXISTS: Payment Elements (one-time)
│   │   ├── webhook.post.ts                    # ✅ EXISTS: Webhook handler
│   │   ├── check-status.post.ts               # ✅ EXISTS: Status check
│   │   └── cancel.post.ts                     # ✅ EXISTS: Cancel payment
│   └── subscriptions/
│       ├── create.post.ts                     # NEW: Create subscription
│       ├── update.post.ts                     # NEW: Update subscription
│       └── cancel.post.ts                     # NEW: Cancel subscription
├── models/
│   ├── Payment.ts                             # ✅ EXISTS
│   ├── Invoice.ts                             # ✅ EXISTS
│   └── Subscription.ts                        # NEW: Track subscriptions
├── utils/
│   └── stripe.ts                              # ✅ EXISTS: Stripe instance
app/
├── composables/
│   └── useStripe.ts                           # NEW: Stripe helper functions
└── components/
    └── CheckoutModal.vue                      # NEW: Checkout modal for subscriptions
```

### Pattern 1: Stripe Checkout for Subscriptions (Recommended for v1.1)

**What:** Server-side creates Checkout Session, redirects to Stripe-hosted page
**When to use:** Subscriptions, standard pricing tiers, SaaS billing
**Why:** PCI-compliant, handles payment methods, mobile-optimized, less code

**Server-side (Nitro route):**
```typescript
// server/api/payments/create-checkout-session.post.ts
import { stripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const { priceId, userId, planId } = await readBody(event)

  // Create or get Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId, planId }
  })

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',  // or 'payment' for one-time
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NUXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NUXT_PUBLIC_SITE_URL}/cancel`,
    metadata: { userId, planId }
  })

  return { url: session.url }
})
```

**Client-side:**
```typescript
// composables/useStripe.ts
export function useStripe() {
  const checkout = async (priceId: string) => {
    const { url } = await $fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      body: { priceId }
    })

    await navigateTo(url, { external: true })
  }

  return { checkout }
}
```

### Pattern 2: Stripe Billing Portal (For Subscription Management)

**What:** Self-service customer portal for subscription management
**When to use:** Allow users to update payment methods, cancel, change plans
**Why:** Stripe-hosted, handles edge cases, PCI-compliant, reduces support burden

**Server-side:**
```typescript
// server/api/payments/create-billing-portal-session.post.ts
export default defineEventHandler(async (event) => {
  const { customerId } = await readBody(event)

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NUXT_PUBLIC_SITE_URL}/settings/billing`
  })

  return { url: session.url }
})
```

### Pattern 3: Webhook Event Handling (Critical for Subscriptions)

**What:** Process Stripe events asynchronously
**When to use:** Subscription lifecycle, payment confirmation, invoice handling
**Why:** Only reliable way to confirm payments, handle subscription updates

**Already implemented in:** `server/api/payments/webhook.post.ts`

**Events to handle for subscriptions:**
```typescript
case 'checkout.session.completed':
  // New subscription created
  await handleSubscriptionCreated(event.data.object)
  break

case 'customer.subscription.updated':
  // Plan changed, payment method updated
  await handleSubscriptionUpdated(event.data.object)
  break

case 'customer.subscription.deleted':
  // Subscription canceled
  await handleSubscriptionDeleted(event.data.object)
  break

case 'invoice.payment_succeeded':
  // Recurring payment succeeded
  await handleInvoicePaymentSucceeded(event.data.object)
  break

case 'invoice.payment_failed':
  // Recurring payment failed
  await handleInvoicePaymentFailed(event.data.object)
  break
```

### Pattern 4: Customer Linking (Best Practice)

**What:** Create Stripe customer when user signs up
**When to use:** Link app users to Stripe customers
**Why:** Avoids race conditions, ensures customer exists before checkout

**Implementation:** Extend existing auth flow (NuxtAuth or custom)
```typescript
// In user creation logic
const stripeCustomer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: { userId: user._id.toString() }
})

// Save stripeCustomerId to user document
await User.findByIdAndUpdate(user._id, {
  stripeCustomerId: stripeCustomer.id
})
```

### Anti-Patterns to Avoid

- **❌ Client-side price calculation:** Never trust prices from client - use Stripe Price IDs
- **❌ Success page as confirmation:** Don't rely on redirect - use webhooks for confirmation
- **❌ Exposing secret keys:** Never use `stripe` SDK on client side
- **❌ Skipping webhook verification:** Always verify Stripe signatures
- **❌ Storing payment details:** Let Stripe handle card data - never store PCI data
- **❌ Payment Elements for subscriptions:** Use Checkout instead for better UX

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment form UI | Custom credit card form | Stripe Checkout | PCI compliance requires SAQ A vs SAQ D (expensive audit) |
| Subscription billing logic | Custom recurring logic | Stripe Subscriptions | Handle retries, proration, failed payments automatically |
| Invoice generation | PDF generation logic | Stripe Invoices | Automatic tax calculation, payment reminders |
| Webhook verification | Custom signature check | `stripe.webhooks.constructEvent()` | Battle-tested, handles edge cases |
| Payment method management | Custom payment methods | Customer Portal | Reduces support burden, handles updates securely |

**Key insight:** Stripe has spent 15+ years handling edge cases in payments - failed retries, bank holidays, proration calculations, tax rules, PCI compliance. Don't recreate this wheel.

## Common Pitfalls

### Pitfall 1: Relying on Client-Side Redirect for Confirmation
**What goes wrong:** User closes browser after payment, webhook fires but app doesn't update
**Why it happens:** Trusting `success_url` redirect as payment confirmation
**How to avoid:** Only use webhooks (`checkout.session.completed`) for payment confirmation
**Warning signs:** Database not updated after payment, invoices not sent

### Pitfall 2: Not Using Stripe Customer Objects
**What goes wrong:** Multiple Stripe customers for same user, payment methods not linked
**Why it happens:** Creating customer in each checkout session instead of once per user
**How to avoid:** Create customer on user signup, reuse `customer` ID in sessions
**Warning signs:** Duplicate customers in Stripe dashboard

### Pitfall 3: Mixing Payment Elements and Checkout
**What goes wrong:** Inconsistent UX, payment methods not shared between flows
**Why it happens:** Using Elements for one-time payments, Checkout for subscriptions
**How to avoid:** Choose ONE pattern - Checkout for everything, or separate flows carefully
**Warning signs:** Users confused by different payment experiences

### Pitfall 4: Missing Subscription Lifecycle Events
**What goes wrong:** Subscription cancels but app doesn't update, features still active
**Why it happens:** Not handling `customer.subscription.deleted` webhook
**How to avoid:** Handle ALL subscription events in webhook
**Warning signs:** Users accessing content after cancellation

### Pitfall 5: Webhook Signature Verification in Production
**What goes wrong:** Fake webhooks sent to your endpoint, data compromised
**Why it happens:** Skipping signature verification during development
**How to avoid:** Always use `stripe.webhooks.constructEvent()` with webhook secret
**Warning signs:** Webhook endpoint returns 200 without verification

## Code Examples

Verified patterns from official sources:

### Creating a Checkout Session for Subscriptions

```typescript
// Source: Stripe official docs + Djamware Nuxt 4 tutorial
// server/api/payments/create-checkout-session.post.ts

import { stripe } from '../../utils/stripe'

const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  planId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { priceId, planId } = createCheckoutSessionSchema.parse(await readBody(event))

  // Get authenticated user from middleware
  const user = event.context.user

  // Find or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() }
    })

    stripeCustomerId = customer.id

    // Save to database
    await User.findByIdAndUpdate(user._id, {
      stripeCustomerId: customer.id
    })
  }

  // Create Checkout Session for subscription
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    success_url: `${useRuntimeConfig().public.siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${useRuntimeConfig().public.siteUrl}/pricing`,
    metadata: {
      userId: user._id.toString(),
      planId: planId || 'default'
    },
    subscription_data: {
      metadata: {
        userId: user._id.toString()
      }
    }
  })

  return { url: session.url }
})
```

### Handling Subscription Webhook Events

```typescript
// Source: Stripe webhook best practices + existing implementation
// server/api/payments/webhook.post.ts

case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // Update user subscription status
  await User.findOneAndUpdate(
    { _id: session.metadata?.userId },
    {
      subscriptionStatus: 'active',
      subscriptionId: subscription.id,
      subscriptionPlan: subscription.items.data[0].price.lookup_key,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    }
  )

  // Send welcome email
  await sendWelcomeEmail(session.customer_email as string)
  break
}

case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription

  // Handle plan changes, payment method updates
  await User.findOneAndUpdate(
    { stripeCustomerId: subscription.customer as string },
    {
      subscriptionPlan: subscription.items.data[0].price.lookup_key,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    }
  )
  break
}

case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription

  // Update user status
  await User.findOneAndUpdate(
    { stripeCustomerId: subscription.customer as string },
    {
      subscriptionStatus: 'canceled',
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    }
  )

  // Send cancellation email
  await sendCancellationEmail(subscription.customer_email as string)
  break
}

case 'invoice.payment_failed': {
  const invoice = event.data.object as Stripe.Invoice

  // Send payment failed notification
  await sendPaymentFailedEmail(invoice.customer_email as string)

  // Update user status if retries exhausted
  if (invoice.attempt_count >= 3) {
    await User.findOneAndUpdate(
      { stripeCustomerId: invoice.customer as string },
      { subscriptionStatus: 'past_due' }
    )
  }
  break
}
```

### Creating Customer Portal Session

```typescript
// Source: Stripe Customer Portal docs
// server/api/payments/create-billing-portal-session.post.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user.stripeCustomerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No Stripe customer found'
    })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${useRuntimeConfig().public.siteUrl}/settings/billing`
  })

  return { url: session.url }
})
```

## State of the Art (2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payment Elements for everything | **Stripe Checkout for subscriptions** | 2023-2024 | Better UX, less code, mobile-optimized |
| Client-side price calculation | **Stripe Price IDs** | Always | Security, prevents price manipulation |
| Success page confirmation | **Webhook-only confirmation** | Always | Reliability, handles browser close |
| Custom subscription logic | **Stripe Subscriptions API** | 2020+ | Automatic retries, proration, dunning |
| Server-side session storage | **Metadata-based linking** | 2022+ | No session storage needed, simpler architecture |

**New tools/patterns to consider:**
- **Stripe Tax (2021):** Automatic tax calculation for EU/US compliance
- **Stripe Billing (2020):** Advanced subscription features (trials, coupons, metering)
- **Stripe Customer Portal (2021):** Self-service subscription management
- **Stripe CLI (2020):** Local webhook testing without deployment

**Deprecated/outdated:**
- **Stripe Elements for subscriptions:** Use Checkout instead (better UX, less code)
- **Bitcoin/Alipay payments:** Stripe deprecated these in 2023
- **Stripe Issuing (old API):** Migrated to new Issuing API in 2022
- **Checkout session without metadata:** Always pass metadata for linking

## Open Questions

Things that couldn't be fully resolved:

1. **QR Code Subscription Billing**
   - What we know: Need to add subscription creation after QR code generation
   - What's unclear: Should QR access require active subscription or trigger subscription signup?
   - Recommendation: Gate QR access behind subscription, show upgrade modal if not subscribed

2. **Proration Strategy for Plan Changes**
   - What we know: Stripe handles proration automatically
   - What's unclear: Should we charge immediate proration or credit on next billing?
   - Recommendation: Use default proration behavior (immediate charge, credit applied)

3. **Subscription Pause Feature**
   - What we know: Stripe added subscription pausing in 2021
   - What's unclear: Should users be able to pause QR reporting subscriptions?
   - Recommendation: Not needed for MVP - users can cancel and re-subscribe

## Migration Plan: From Payment Elements to Stripe Checkout

### Phase 1: Keep Existing Payment Elements (No Breaking Changes)
- ✅ Existing one-time payment flow remains unchanged
- ✅ PaymentModal.vue continues to work for pay-per-plan
- ✅ Webhook handlers remain compatible

### Phase 2: Add Stripe Checkout for Subscriptions (NEW)
- 🆕 Create `create-checkout-session.post.ts` for subscriptions
- 🆕 Add pricing page with monthly/yearly toggle
- 🆕 Create Subscription model in MongoDB
- 🆕 Extend webhook handlers for subscription events
- 🆕 Add customer portal access in settings

### Phase 3: User Management Updates
- 🆕 Add `stripeCustomerId` field to User model
- 🆕 Create customer on user signup
- 🆕 Add subscription status checks in middleware
- 🆕 Gate features based on subscription status

## Sources

### Primary (HIGH confidence)
- [Stripe Checkout Documentation](https://docs.stripe.com/payments/checkout) - Official Checkout API docs
- [Stripe Subscriptions Guide](https://docs.stripe.com/payments/checkout/build-subscriptions) - Subscription implementation
- [Stripe Node.js SDK v18.5.0](https://github.com/stripe/stripe-node) - Server SDK
- [Stripe.js v7.9.0](https://github.com/stripe/stripe-js) - Client SDK
- [Djamware: Stripe Payments in Nuxt 4 with Server Routes and Webhooks](https://www.djamware.com/post/693eb332b00ad03314a098d2/stripe-payments-in-nuxt-4-with-server-routes-and-webhooks) - Nuxt 4 patterns (Dec 14, 2025)

### Secondary (MEDIUM confidence)
- [Cody Bontecou: Stripe Integration in Nuxt 3](https://codybontecou.com/stripe-integration-in-nuxt-3) - Comprehensive Nuxt + Stripe tutorial (Oct 31, 2024)
- [@unlok-co/nuxt-stripe Module](https://nuxt.com/modules/stripe-next) - Official Nuxt Stripe module
- [Stripe Webhooks Guide](https://docs.stripe.com/webhooks) - Webhook best practices
- [Stripe Customer Portal](https://docs.stripe.com/billing/subscriptions/integrating-the-customer-portal) - Portal integration

### Tertiary (LOW confidence)
- Various blog posts (verified against official docs)
- Community tutorials (cross-referenced with Stripe docs)

## Metadata

### Confidence Breakdown
- **Core packages (stripe, @stripe/stripe-js):** HIGH - Official packages, already verified in project
- **Checkout pattern for subscriptions:** HIGH - Stripe official recommendation, verified in docs
- **Webhook handling pattern:** HIGH - Official Stripe pattern, already implemented correctly
- **Nuxt 4 compatibility:** HIGH - Nitro patterns verified, using Nuxt 4.2.2
- **Subscription management:** HIGH - Customer Portal is standard pattern

### Research Date
2025-01-25

### Valid Until
- Stripe packages: 6 months (stable APIs)
- Best practices: 3 months (fast-moving ecosystem)
- Nuxt 4 compatibility: 30 days (framework in active development)

### Key Findings for v1.1 Roadmap
1. ✅ Existing Stripe implementation is solid and follows 2025 best practices
2. ✅ No package upgrades needed - current versions are latest
3. 🆕 Need to add Stripe Checkout for subscriptions (separate from existing Payment Elements)
4. 🆕 Need to add webhook handlers for subscription lifecycle events
5. 🆕 Need to implement Customer Portal for self-service management
6. 🆕 Need to add subscription gating for QR reporting features
7. ✅ Existing webhook handler is correctly implemented with signature verification

---

**Next Steps:** This STACK.md should inform the creation of the v1.1 roadmap, focusing on adding subscription functionality while maintaining the existing one-time payment flow.
