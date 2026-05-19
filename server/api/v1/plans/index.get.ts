import { EmergencyPlan } from '../../../models/EmergencyPlan'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const query = getQuery(event)
    const centerId = query.centerId as string
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const filter: any = { tenantId: user.tenantId || user._id }
    if (centerId) filter.centerId = centerId
    const total = await EmergencyPlan.countDocuments(filter)
    const plans = await EmergencyPlan.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
    return { success: true, data: plans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
