import { Worker } from '../../../models/Worker'
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
    else { const accessibleIds = await getAccessibleCenterIds(event); if (accessibleIds.length === 0) return { success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } }; filter['centers.centerId'] = { $in: accessibleIds } }
    if (centerId) filter['centers.centerId'] = centerId
    const total = await Worker.countDocuments(filter)
    const workers = await Worker.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
    return { success: true, data: workers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
