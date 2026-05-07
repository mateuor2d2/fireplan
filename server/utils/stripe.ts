import Stripe from 'stripe'
import type { ISubscription } from '../types/subscription'

// ——— NEW subscription product helpers ———

export function getStripe(): Stripe {
  const config = useRuntimeConfig()
  const secretKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Stripe secret key is not configured')
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion
  })
}

export function getStripeWebhookSecret(): string {
  const config = useRuntimeConfig()
  return config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''
}

// Map internal plan IDs to Stripe Price IDs (configured in dashboard)
export function getStripePriceId(planId: string, yearly: boolean): string {
  const envVar = yearly
    ? `STRIPE_PRICE_${planId.toUpperCase()}_YEARLY`
    : `STRIPE_PRICE_${planId.toUpperCase()}_MONTHLY`

  const priceId = process.env[envVar]
  if (!priceId) {
    throw new Error(`Stripe Price ID not configured for plan ${planId} ${yearly ? 'yearly' : 'monthly'}`)
  }
  return priceId
}

// ——— LEGACY one-time payment / QR subscription helpers ———

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true
})

export const STRIPE_CONFIG = {
  currency: 'eur',
  companyInfo: {
    name: 'Cima20, proyectos técnicos sl',
    address: {
      line1: 'Pau Piferrer, 8 bajos',
      city: 'Palma de Mallorca',
      postal_code: '07011',
      country: 'ES'
    },
    tax_id: 'B07947955',
    phone: '+34 971 714 584',
    email: 'administracion@cima20.com.com'
  },
  invoiceSettings: {
    default_payment_method: 'card',
    custom_fields: [
      {
        name: 'plan_id',
        label: 'ID del Plan'
      }
    ]
  }
} as const

/**
 * Creates a Stripe subscription for QR issue reporting
 */
export async function createQrSubscription(params: {
  customerId: string
  planId: string
  billingInterval: 'month' | 'year'
  paymentMethodId: string
  metadata?: Record<string, any>
}): Promise<Stripe.Subscription> {
  const { customerId, planId, billingInterval, paymentMethodId, metadata = {} } = params

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  })

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  })

  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{
      price: billingInterval === 'year'
        ? process.env.STRIPE_YEARLY_PRICE_ID || ''
        : process.env.STRIPE_MONTHLY_PRICE_ID || '',
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

  if (billingInterval === 'year' && process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID) {
    subscriptionData.discounts = [{ coupon: process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID }]
  }

  return await stripe.subscriptions.create(subscriptionData)
}

/**
 * Updates an existing Stripe subscription
 */
export async function updateQrSubscription(params: {
  subscriptionId: string
  updates: Stripe.SubscriptionUpdateParams
}): Promise<Stripe.Subscription> {
  const { subscriptionId, updates } = params
  return await stripe.subscriptions.update(subscriptionId, updates)
}

/**
 * Cancels a Stripe subscription immediately or at period end
 */
export async function cancelQrSubscription(params: {
  subscriptionId: string
  cancelAtPeriodEnd?: boolean
}): Promise<Stripe.Subscription> {
  const { subscriptionId, cancelAtPeriodEnd = true } = params

  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })
  } else {
    return await stripe.subscriptions.cancel(subscriptionId)
  }
}

/**
 * Checks if user has access to subscription (including grace period)
 */
export function hasSubscriptionAccess(subscription: ISubscription): boolean {
  return subscription.status === 'active' || subscription.status === 'past_due'
}

/**
 * Checks if subscription is truly expired (access should be revoked)
 */
export function isSubscriptionExpired(subscription: ISubscription): boolean {
  return subscription.status === 'canceled' || subscription.status === 'incomplete_expired'
}
