import { z } from 'zod'
import { Subscription } from '../../../models/Subscription'
import { Planes } from '../../../models/Planes'

/**
 * Route parameter schema for subscription ID validation
 */
const subscriptionIdSchema = z.string().min(1, 'Subscription ID is required')

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

    // Extract subscription ID from router params
    const subscriptionId = event.context.params?.id
    if (!subscriptionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Subscription ID is required'
      })
    }

    // Validate subscription ID format
    subscriptionIdSchema.parse(subscriptionId)

    // Query subscription with ownership check
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId
    }).lean()

    if (!subscription) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Subscription not found or you do not have access to this subscription'
      })
    }

    // Fetch associated plan details
    const plan = await Planes.findById(subscription.planId)
      .select('nom_obra desc_obra')
      .lean()

    return {
      success: true,
      data: {
        subscription: {
          ...subscription,
          plan: plan
            ? {
                id: plan._id.toString(),
                nom_obra: plan.nom_obra,
                desc_obra: plan.desc_obra
              }
            : null
        }
      }
    }
  } catch (error: any) {
    console.error('Get subscription error:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid subscription ID',
        data: error.errors
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get subscription'
    })
  }
})
