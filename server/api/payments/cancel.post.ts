import { z } from 'zod'
import { stripe } from '../../utils/stripe'
import { Payment } from '../../models/Payment'
import { Planes } from '../../models/Planes'

const cancelPaymentSchema = z.object({
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
    const { planId } = cancelPaymentSchema.parse(body)

    // Verify plan exists and belongs to user
    const plan = await Planes.findOne({ _id: planId, createdBy: userId })
    if (!plan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plan not found'
      })
    }

    // Check if plan has a payment
    if (!plan.paymentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Plan has no associated payment'
      })
    }

    // Get the payment record
    const payment = await Payment.findById(plan.paymentId)
    if (!payment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Payment not found'
      })
    }

    // Check if payment can be canceled
    if (payment.status === 'succeeded') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot cancel a succeeded payment'
      })
    }

    // If the payment has a Stripe payment intent, try to cancel it
    if (payment.stripePaymentIntentId) {
      try {
        // First, check the current status of the payment intent
        const existingIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)
        console.log('Current Stripe payment intent status:', existingIntent.status)

        // Only try to cancel if it's not already canceled or succeeded
        if (!['canceled', 'succeeded'].includes(existingIntent.status)) {
          const paymentIntent = await stripe.paymentIntents.cancel(payment.stripePaymentIntentId)
          console.log('Stripe payment intent canceled:', paymentIntent.id)
        } else {
          console.log('Payment intent already in final state:', existingIntent.status)
        }

        // Update our local payment record
        payment.status = 'canceled'
        await payment.save()
      } catch (stripeError: any) {
        // If we can't cancel the Stripe payment intent, we'll still update our local record
        console.warn('Could not cancel Stripe payment intent:', stripeError.message)

        // Update our local payment record
        payment.status = 'canceled'
        await payment.save()
      }
    } else {
      // Update our local payment record
      payment.status = 'canceled'
      await payment.save()
    }

    // Update the plan status
    plan.paymentStatus = 'unpaid'
    plan.paymentId = undefined // Remove the payment reference
    await plan.save()

    console.log('Payment cancellation completed:', {
      paymentId: payment._id,
      paymentStatus: payment.status,
      planId: plan._id,
      planPaymentStatus: plan.paymentStatus
    })

    return {
      success: true,
      message: 'Payment canceled successfully',
      details: {
        paymentStatus: payment.status,
        planStatus: plan.paymentStatus
      }
    }
  } catch (error: any) {
    console.error('Cancel payment error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to cancel payment'
    })
  }
})
