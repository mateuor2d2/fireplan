import { z } from 'zod'
import { stripe, STRIPE_CONFIG, createQrSubscription } from '../../utils/stripe'
import type Stripe from 'stripe'
import { Subscription } from '../../models/Subscription'
import { Planes } from '../../models/Planes'
import { User } from '../../models/User'

/**
 * Body schema for creating a subscription
 */
const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  billingInterval: z.enum(['month', 'year'], {
    errorMap: () => ({ message: 'Billing interval must be "month" or "year"' })
  }),
  paymentMethodId: z.string().min(1, 'Payment method ID is required')
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
        statusMessage: 'Plan not found or you do not have access to this plan'
      })
    }

    // Check for existing active subscription on this plan
    const existingSubscription = await Subscription.findOne({
      planId,
      userId,
      status: { $in: ['active', 'past_due'] }
    })

    if (existingSubscription) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ya existe una suscripción activa para este plan. Por favor, gestione la suscripción existente.'
      })
    }

    // Get user information
    const user = await User.findById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Create or find existing customer in Stripe
    let stripeCustomer: Stripe.Customer
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0]!
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.matriz_nombre,
        metadata: {
          userId: userId
        }
      })
    }

    // Call createQrSubscription helper function
    const stripeSubscription = await createQrSubscription({
      customerId: stripeCustomer.id,
      planId,
      billingInterval,
      paymentMethodId,
      metadata: {
        userId,
        planId,
        planName: plan.nom_obra,
        billingInterval
      }
    })

    // Extract client secret from latest invoice payment intent
    const latestInvoice = stripeSubscription.latest_invoice as any
    const clientSecret = latestInvoice?.payment_intent?.client_secret || null

    // Get the price ID used for this subscription
    const stripePriceId = stripeSubscription.items.data[0]?.price.id || ''

    // Calculate subscription amount from the price
    const price = stripeSubscription.items.data[0]?.price
    const amount = (price?.unit_amount || 0) / 100 // Convert from cents to euros

    // Determine annual prepayment discount
    const annualPrepaymentDiscount = billingInterval === 'year' ? 15 : undefined

    // Save subscription to database
    const subscription = new Subscription({
      userId,
      planId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeCustomer.id,
      stripePriceId,
      status: stripeSubscription.status as 'active' | 'past_due' | 'canceled' | 'paused' | 'expired',
      billingInterval,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
      annualPrepaymentDiscount,
      amount,
      currency: price?.currency || STRIPE_CONFIG.currency,
      metadata: {
        planName: plan.nom_obra,
        stripeCustomerId: stripeCustomer.id
      }
    })

    await subscription.save()

    return {
      success: true,
      data: {
        subscriptionId: subscription._id.toString(),
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        clientSecret,
        amount,
        currency: price?.currency || STRIPE_CONFIG.currency,
        billingInterval,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    }
  } catch (error: any) {
    console.error('Create subscription error:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
        data: error.errors
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create subscription'
    })
  }
})
