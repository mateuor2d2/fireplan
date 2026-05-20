import { EmergencyPlan } from '../../../models/EmergencyPlan'
import { getAccessibleCenterIds } from '../../../utils/authorize'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const centerId = query.centerId as string
    const filter: any = {}
    if (user.role === 'superadmin') { } else if (user.role === 'tenant') { filter.tenantId = user.tenantId }
    else { const accessibleIds = await getAccessibleCenterIds(event); if (accessibleIds.length === 0) return { success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } }; filter.centerId = { $in: accessibleIds } }
    if (centerId) filter.centerId = centerId
    const total = await EmergencyPlan.countDocuments(filter)
    const plans = await EmergencyPlan.find(filter).sort({ version: -1 }).skip((page - 1) * limit).limit(limit)
    return { success: true, data: plans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
