import { EmergencyPlan } from '../../../models/EmergencyPlan'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const query = getQuery(event)
    const centerId = query.centerId as string
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20

    const filter: any = { tenantId: user.tenantId }
    if (centerId) filter.centerId = centerId

    const [plans, total] = await Promise.all([
      EmergencyPlan.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      EmergencyPlan.countDocuments(filter)
    ])

    return { success: true, data: plans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
