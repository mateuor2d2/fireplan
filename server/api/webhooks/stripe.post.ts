import { getStripe, getStripeWebhookSecret } from '../../utils/stripe'
import { User } from '../../models/User'
import { Subscription } from '../../models/Subscription'
import type Stripe from 'stripe'

// Legacy handlers for one-time plan payments and QR-per-plan subscriptions
import {
  handleCheckoutSessionCompleted as handleLegacyCheckout,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handlePaymentIntentCanceled,
  handleSubscriptionCreated as handleLegacySubscriptionCreated,
  handleSubscriptionUpdated as handleLegacySubscriptionUpdated,
  handleSubscriptionDeleted as handleLegacySubscriptionDeleted
} from '../../utils/webhookHandlers'

// Stripe webhook handler
// Must receive raw body for signature verification
export default defineEventHandler(async (event) => {
  const stripe = getStripe()
  const secret = getStripeWebhookSecret()

  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'Webhook secret not configured' })
  }

  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body!, signature, secret)
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`)
    throw createError({ statusCode: 400, statusMessage: `Webhook Error: ${err.message}` })
  }

  console.log(`[Webhook] Received event: ${stripeEvent.type} id=${stripeEvent.id}`)

  try {
    switch (stripeEvent.type) {
      // ——— Checkout sessions ———
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          // Product subscription (new pricing tiers)
          await handleProductCheckoutCompleted(session)
        } else if (session.mode === 'payment') {
          // Legacy one-time plan payment
          await handleLegacyCheckout(session)
        }
        break
      }

      // ——— Payment intents (legacy one-time payments) ———
      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }
      case 'payment_intent.canceled': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent
        await handlePaymentIntentCanceled(paymentIntent)
        break
      }

      // ——— Subscriptions (product OR legacy QR-per-plan) ———
      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const isLegacy = await isLegacySubscription(subscription.id)
        if (isLegacy) {
          await handleLegacySubscriptionCreated(subscription)
        } else {
          await handleProductSubscriptionUpdated(subscription)
        }
        break
      }
      case 'invoice.paid': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | undefined
        if (!subscriptionId) break
        const isLegacy = await isLegacySubscription(subscriptionId)
        if (!isLegacy) {
          await handleProductSubscriptionUpdated(await stripe.subscriptions.retrieve(subscriptionId))
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | undefined
        if (!subscriptionId) break
        const isLegacy = await isLegacySubscription(subscriptionId)
        if (!isLegacy) {
          await handleProductSubscriptionUpdated(await stripe.subscriptions.retrieve(subscriptionId))
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const isLegacy = await isLegacySubscription(subscription.id)
        if (isLegacy) {
          await handleLegacySubscriptionUpdated(subscription)
        } else {
          await handleProductSubscriptionUpdated(subscription)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const isLegacy = await isLegacySubscription(subscription.id)
        if (isLegacy) {
          await handleLegacySubscriptionDeleted(subscription)
        } else {
          await handleProductSubscriptionDeleted(subscription)
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${stripeEvent.type}`)
    }
  } catch (error: any) {
    console.error(`[Webhook] Error processing event ${stripeEvent.type}:`, error)
    throw createError({ statusCode: 500, statusMessage: 'Webhook handler failed' })
  }

  return { received: true }
})

// Helper: detect if a subscription belongs to the legacy QR-per-plan system
async function isLegacySubscription(stripeSubscriptionId: string): Promise<boolean> {
  try {
    const sub = await Subscription.findOne({ stripeSubscriptionId })
    return !!sub
  } catch {
    return false
  }
}

// ——— Product subscription handlers (new pricing tiers) ———

async function handleProductCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId } = session.metadata || {}
  if (!userId || !planId) {
    console.error('[Webhook] Missing metadata in subscription checkout session')
    return
  }

  const subscriptionId = session.subscription as string
  if (!subscriptionId) return

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  await User.updateOne(
    { _id: userId },
    {
      plan: planId,
      subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: session.customer as string,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  )

  console.log(`[Webhook] Product subscription activated for user ${userId}: plan=${planId}`)
}

async function handleProductSubscriptionUpdated(subscription: Stripe.Subscription) {
  const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status
  const periodEnd = new Date(subscription.current_period_end * 1000)

  await User.updateOne(
    { stripeSubscriptionId: subscription.id },
    {
      subscriptionStatus: status,
      subscriptionCurrentPeriodEnd: periodEnd
    }
  )

  console.log(`[Webhook] Product subscription updated: ${subscription.id} -> ${status}`)
}

async function handleProductSubscriptionDeleted(subscription: Stripe.Subscription) {
  await User.updateOne(
    { stripeSubscriptionId: subscription.id },
    {
      subscriptionStatus: 'canceled',
      plan: 'starter',
      stripeSubscriptionId: undefined,
      subscriptionCurrentPeriodEnd: undefined
    }
  )

  console.log(`[Webhook] Product subscription deleted: ${subscription.id}`)
}
