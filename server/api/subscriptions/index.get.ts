import { z } from 'zod'
import { Subscription } from '../../models/Subscription'
import { Planes } from '../../models/Planes'

/**
 * Query schema for listing subscriptions
 * Supports filtering by planId, status, and pagination
 */
const listSubscriptionsQuerySchema = z.object({
  planId: z.string().optional(),
  status: z.enum(['active', 'past_due', 'canceled', 'paused', 'expired']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10)
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

    // Parse and validate query parameters
    const query = getQuery(event)
    const validatedQuery = listSubscriptionsQuerySchema.parse(query)

    const { planId, status, page, limit } = validatedQuery
    const skip = (page - 1) * limit

    // Build query filter
    const filter: any = { userId }
    if (planId) {
      filter.planId = planId
    }
    if (status) {
      filter.status = status
    }

    // Query subscriptions with filter, sorted by most recent first
    const subscriptions = await Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await Subscription.countDocuments(filter)

    // Enrich subscriptions with plan details
    const subscriptionsWithPlans = await Promise.all(
      subscriptions.map(async (subscription) => {
        const plan = await Planes.findById(subscription.planId)
          .select('nom_obra desc_obra')
          .lean()

        return {
          ...subscription,
          plan: plan
            ? {
                id: plan._id.toString(),
                nom_obra: plan.nom_obra,
                desc_obra: plan.desc_obra
              }
            : null
        }
      })
    )

    return {
      success: true,
      data: {
        subscriptions: subscriptionsWithPlans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error: any) {
    console.error('List subscriptions error:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: error.errors
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to list subscriptions'
    })
  }
})
