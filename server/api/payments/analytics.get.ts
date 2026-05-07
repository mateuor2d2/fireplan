import { PaymentAnalytics } from '../../models/PaymentAnalytics'
import { Payment } from '../../models/Payment'
import { Planes } from '../../models/Planes'

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

    const userId = user._id.toString()

    // Get query parameters
    const query = getQuery(event)
    const period = query.period as string || '7d' // 7d, 30d, 90d, 1y
    const planId = query.planId as string

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Build base query
    const baseQuery: any = {
      userId,
      createdAt: { $gte: startDate }
    }

    if (planId) {
      baseQuery.planId = planId
    }

    // Get analytics data
    const analytics = await PaymentAnalytics.find(baseQuery)
      .sort({ createdAt: 1 })
      .lean()

    // Get conversion funnel data
    const funnelData = await getConversionFunnelData(baseQuery)

    // Get payment success metrics
    const paymentMetrics = await getPaymentMetrics(baseQuery)

    // Get device analytics
    const deviceAnalytics = await getDeviceAnalytics(baseQuery)

    // Get time-based analytics
    const timeAnalytics = await getTimeBasedAnalytics(baseQuery, period)

    return {
      success: true,
      data: {
        period,
        funnel: funnelData,
        metrics: paymentMetrics,
        devices: deviceAnalytics,
        timeData: timeAnalytics,
        totalEvents: analytics.length,
        dateRange: {
          start: startDate,
          end: now
        }
      }
    }
  } catch (error: any) {
    console.error('Get payment analytics error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get payment analytics'
    })
  }
})

// Helper functions
async function getConversionFunnelData(baseQuery: any) {
  const events = await PaymentAnalytics.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        event: '$_id',
        count: 1,
        uniqueSessions: { $size: '$uniqueSessions' }
      }
    }
  ])

  const eventMap = new Map(events.map(e => [e.event, e]))

  const funnel = {
    checkout_started: eventMap.get('checkout_started')?.count || 0,
    payment_modal_opened: eventMap.get('payment_modal_opened')?.count || 0,
    payment_attempted: eventMap.get('payment_attempted')?.count || 0,
    payment_succeeded: eventMap.get('payment_succeeded')?.count || 0,
    payment_failed: eventMap.get('payment_failed')?.count || 0,
    checkout_completed: eventMap.get('checkout_completed')?.count || 0
  }

  // Calculate conversion rates
  const conversionRates = {
    modal_open_rate: funnel.checkout_started > 0 ? (funnel.payment_modal_opened / funnel.checkout_started) * 100 : 0,
    payment_attempt_rate: funnel.payment_modal_opened > 0 ? (funnel.payment_attempted / funnel.payment_modal_opened) * 100 : 0,
    payment_success_rate: funnel.payment_attempted > 0 ? (funnel.payment_succeeded / funnel.payment_attempted) * 100 : 0,
    overall_conversion_rate: funnel.checkout_started > 0 ? (funnel.checkout_completed / funnel.checkout_started) * 100 : 0
  }

  return {
    funnel,
    conversionRates
  }
}

async function getPaymentMetrics(baseQuery: any) {
  // Get payment success/failure data
  const paymentEvents = await PaymentAnalytics.find({
    ...baseQuery,
    event: { $in: ['payment_succeeded', 'payment_failed'] }
  }).lean()

  const totalRevenue = paymentEvents
    .filter(e => e.event === 'payment_succeeded')
    .reduce((sum, e) => sum + (e.eventData.amount || 0), 0)

  const averageProcessingTime = paymentEvents
    .filter(e => e.eventData.processingTime)
    .reduce((sum, e) => sum + (e.eventData.processingTime || 0), 0)
    / paymentEvents.filter(e => e.eventData.processingTime).length || 0

  // Get error breakdown
  const errorBreakdown = paymentEvents
    .filter(e => e.event === 'payment_failed' && e.eventData.errorCode)
    .reduce((acc, e) => {
      const code = e.eventData.errorCode || 'unknown'
      acc[code] = (acc[code] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  return {
    totalRevenue,
    averageProcessingTime: Math.round(averageProcessingTime),
    paymentAttempts: paymentEvents.length,
    errorBreakdown
  }
}

async function getDeviceAnalytics(baseQuery: any) {
  const deviceEvents = await PaymentAnalytics.find({
    ...baseQuery,
    'eventData.deviceType': { $exists: true }
  }).lean()

  const deviceBreakdown = deviceEvents.reduce((acc, e) => {
    const device = e.eventData.deviceType || 'unknown'
    if (!acc[device]) {
      acc[device] = { total: 0, successful: 0 }
    }
    acc[device].total++
    if (e.event === 'payment_succeeded') {
      acc[device].successful++
    }
    return acc
  }, {} as Record<string, { total: number, successful: number }>)

  // Calculate success rates by device
  const deviceSuccessRates = Object.entries(deviceBreakdown).map(([device, data]) => ({
    device,
    total: data.total,
    successful: data.successful,
    successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0
  }))

  return deviceSuccessRates
}

async function getTimeBasedAnalytics(baseQuery: any, period: string) {
  const events = await PaymentAnalytics.find(baseQuery)
    .sort({ createdAt: 1 })
    .lean()

  // Group events by time period
  const timeGroups = new Map<string, any>()

  events.forEach((event) => {
    const date = new Date(event.createdAt)
    let key: string

    switch (period) {
      case '1d':
        key = date.toISOString().slice(0, 13) + ':00' // Hourly
        break
      case '7d':
      case '30d':
        key = date.toISOString().slice(0, 10) // Daily
        break
      case '90d':
      case '1y':
        key = date.toISOString().slice(0, 7) // Monthly
        break
      default:
        key = date.toISOString().slice(0, 10) // Daily
    }

    if (!timeGroups.has(key)) {
      timeGroups.set(key, {
        timestamp: key,
        checkout_started: 0,
        payment_succeeded: 0,
        payment_failed: 0,
        revenue: 0
      })
    }

    const group = timeGroups.get(key)
    group[event.event] = (group[event.event] || 0) + 1

    if (event.event === 'payment_succeeded') {
      group.revenue += event.eventData.amount || 0
    }
  })

  return Array.from(timeGroups.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}
