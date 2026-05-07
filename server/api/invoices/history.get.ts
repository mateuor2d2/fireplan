import { Invoice } from '../../models/Invoice'
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
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    // Get filter parameters
    const status = query.status as string | undefined
    const startDate = query.startDate as string | undefined
    const endDate = query.endDate as string | undefined

    // Build MongoDB filter object dynamically
    const filter: any = { userId }

    // Add status filter if provided
    if (status) {
      const validStatuses = ['paid', 'open', 'void', 'uncollectible', 'draft']
      if (!validStatuses.includes(status)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid status filter'
        })
      }
      filter.status = status
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate)
      }
    }

    // Get invoices with plan information
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get plan information for each invoice
    const invoicesWithPlans = await Promise.all(
      invoices.map(async (invoice) => {
        const plan = await Planes.findById(invoice.planId).select('nom_obra desc_obra').lean()
        return {
          ...invoice,
          plan: plan
            ? {
                id: plan._id,
                nom_obra: plan.nom_obra,
                desc_obra: plan.desc_obra
              }
            : null
        }
      })
    )

    // Get total count (exclude filters from total count)
    const total = await Invoice.countDocuments({ userId })

    return {
      success: true,
      data: {
        invoices: invoicesWithPlans,
        filters: { status, startDate, endDate },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error: any) {
    console.error('Get invoice history error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get invoice history'
    })
  }
})
