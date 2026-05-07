import { z } from 'zod'
import { stripe } from '../../utils/stripe'
import { Payment } from '../../models/Payment'
import { Planes } from '../../models/Planes'

const checkPaymentStatusSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
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
    const { paymentId, planId } = checkPaymentStatusSchema.parse(body)

    // Verify payment exists and belongs to user
    const payment = await Payment.findOne({ _id: paymentId, userId })
    if (!payment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Payment not found'
      })
    }

    // Verify plan exists and belongs to user
    const plan = await Planes.findOne({ _id: planId, createdBy: userId })
    if (!plan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plan not found'
      })
    }

    // Check if we have a Stripe payment intent ID
    if (!payment.stripePaymentIntentId) {
      return {
        success: true,
        status: payment.status,
        message: 'Payment has no associated Stripe payment intent'
      }
    }

    // Retrieve the actual Stripe payment intent status
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId)

      // Update our local payment record if the status has changed
      if (paymentIntent.status !== payment.status) {
        payment.status = paymentIntent.status
        await payment.save()

        // Update the plan status if needed
        let newPlanStatus = plan.paymentStatus
        if (paymentIntent.status === 'succeeded') {
          newPlanStatus = 'paid'
        } else if (paymentIntent.status === 'failed' || paymentIntent.status === 'canceled') {
          newPlanStatus = 'unpaid'
        } else if (paymentIntent.status === 'requires_payment_method') {
          // If the payment intent requires a payment method, it means the previous attempt failed
          // and the user can retry
          newPlanStatus = 'unpaid'
        }

        if (newPlanStatus !== plan.paymentStatus) {
          plan.paymentStatus = newPlanStatus
          await plan.save()
        }
      }

      return {
        success: true,
        status: paymentIntent.status,
        message: `Payment intent status: ${paymentIntent.status}`
      }
    } catch (stripeError: any) {
      console.error('Stripe payment intent retrieval error:', stripeError)

      // If we can't retrieve the payment intent, return the local status
      return {
        success: true,
        status: payment.status,
        message: `Could not retrieve Stripe payment intent: ${stripeError.message}`
      }
    }
  } catch (error: any) {
    console.error('Check payment status error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to check payment status'
    })
  }
})
