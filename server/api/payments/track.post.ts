import { PaymentAnalytics } from '../../models/PaymentAnalytics'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication through middleware
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Get tracking data from request body
    const body = await readBody(event)

    // Validate required fields
    const requiredFields = ['userId', 'planId', 'sessionId', 'event', 'eventData']
    for (const field of requiredFields) {
      if (!body[field]) {
        throw createError({
          statusCode: 400,
          statusMessage: `Missing required field: ${field}`
        })
      }
    }

    // Verify user ID matches authenticated user
    if (body.userId !== user._id.toString()) {
      throw createError({
        statusCode: 403,
        statusMessage: 'User ID mismatch'
      })
    }

    // Validate event type
    const validEvents = ['checkout_started', 'payment_modal_opened', 'payment_attempted', 'payment_succeeded', 'payment_failed', 'payment_cancelled', 'checkout_completed']
    if (!validEvents.includes(body.event)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid event type: ${body.event}`
      })
    }

    // Create analytics record
    const analyticsRecord = new PaymentAnalytics({
      userId: body.userId,
      planId: body.planId,
      sessionId: body.sessionId,
      event: body.event,
      eventData: {
        ...body.eventData,
        timestamp: body.eventData.timestamp ? new Date(body.eventData.timestamp) : new Date()
      }
    })

    await analyticsRecord.save()

    // Log for debugging
    console.log('Payment analytics tracked:', {
      userId: body.userId,
      planId: body.planId,
      event: body.event,
      sessionId: body.sessionId,
      timestamp: analyticsRecord.createdAt
    })

    return {
      success: true,
      message: 'Payment analytics tracked successfully',
      data: {
        id: analyticsRecord._id,
        event: body.event,
        timestamp: analyticsRecord.createdAt
      }
    }
  } catch (error: any) {
    console.error('Track payment analytics error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to track payment analytics'
    })
  }
})
