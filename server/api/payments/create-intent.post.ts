import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { stripe, STRIPE_CONFIG } from '../../utils/stripe'
import { Payment } from '../../models/Payment'
import { Planes } from '../../models/Planes'
import { User } from '../../models/User'
import { getPricingConfig, formatPriceEur } from '../../config/pricing'

const createPaymentIntentSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required')
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
    const { planId } = createPaymentIntentSchema.parse(body)

    // Verify plan exists and belongs to user
    const plan = await Planes.findOne({ _id: planId, createdBy: userId })

    if (!plan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plan not found'
      })
    }

    // Check if plan is already paid
    if (plan.paymentStatus === 'paid') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Plan is already paid for'
      })
    }

    // Check if there's an existing incomplete payment for this plan
    let existingPayment = null
    if (plan.paymentId) {
      existingPayment = await Payment.findById(plan.paymentId)
    }

    // If there's an existing payment that failed or was canceled, we should allow creating a new one
    // Also allow if the existing payment is pending but the Stripe payment intent is actually canceled
    let shouldAllowNewPayment = !existingPayment
      || existingPayment.status === 'failed'
      || existingPayment.status === 'canceled'

    // If there's a pending payment, check the actual Stripe status
    if (existingPayment && existingPayment.status === 'pending' && existingPayment.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(existingPayment.stripePaymentIntentId)
        // Allow new payment if the Stripe payment intent is canceled or still requires payment method
        shouldAllowNewPayment = paymentIntent.status === 'canceled'
          || paymentIntent.status === 'requires_payment_method'
          || paymentIntent.status === 'requires_confirmation'
      } catch (error) {
        // If we can't retrieve the payment intent, assume it's safe to create a new one
        // This allows retrying when Stripe API is unavailable
        shouldAllowNewPayment = true
      }
      // If no existing payment OR we're allowing retry, proceed
      if (!existingPayment || shouldAllowNewPayment) {
        // Clear the flag - we're good to proceed
        shouldAllowNewPayment = true
      }
    }

    // Get user information
    const user = await User.findById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // If we shouldn't allow a new payment, return an error
    if (!shouldAllowNewPayment) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ya existe un pago en proceso para este plan. Por favor, complete o cancele el pago existente.'
      })
    }

    // Get price from user settings or use configured default
    const pricingConfig = await getPricingConfig()
    const amount = pricingConfig.defaultPrecioPSS // Already in cents

    // Create or find existing customer in Stripe
    let stripeCustomer
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0]
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId
        }
      })
    }

    // Create payment intent - only enable card payments
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricingConfig.planPrice, // Use configured plan price
      currency: STRIPE_CONFIG.currency,
      customer: stripeCustomer.id,
      description: `Impresión del Plan: ${plan.nom_obra}`,
      metadata: {
        userId,
        planId,
        planName: plan.nom_obra
      },
      payment_method_types: ['card'] // Only enable card payments
    })

    let payment

    // If we have an existing payment that we can reuse, update it
    if (existingPayment && shouldAllowNewPayment) {
      // Update the existing payment with new Stripe payment intent
      existingPayment.stripePaymentIntentId = paymentIntent.id
      existingPayment.amount = amount / 100 // Store in euros
      existingPayment.currency = STRIPE_CONFIG.currency
      existingPayment.status = 'pending'
      existingPayment.description = `Impresión del Plan: ${plan.nom_obra}`
      existingPayment.metadata = {
        planName: plan.nom_obra,
        stripeCustomerId: stripeCustomer.id
      }

      await existingPayment.save()
      payment = existingPayment
    } else {
      // Create a new payment record
      payment = new Payment({
        userId,
        planId,
        stripePaymentIntentId: paymentIntent.id,
        amount: amount / 100, // Store in euros
        currency: STRIPE_CONFIG.currency,
        status: 'pending',
        description: `Impresión del Plan: ${plan.nom_obra}`,
        metadata: {
          planName: plan.nom_obra,
          stripeCustomerId: stripeCustomer.id
        }
      })

      await payment.save()
    }

    // Update plan status to processing
    await Planes.findByIdAndUpdate(planId, {
      paymentStatus: 'processing',
      paymentId: payment._id
    })

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount / 100,
        currency: STRIPE_CONFIG.currency
      }
    }
  } catch (error: any) {
    console.error('Create payment intent error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create payment intent'
    })
  }
})
