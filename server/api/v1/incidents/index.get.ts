import { Incident } from '../../../models/Incident'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const query = getQuery(event)
    const centerId = query.centerId as string
    const status = query.status as string
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const filter: any = { tenantId: user.tenantId || user._id }
    if (centerId) filter.centerId = centerId
    if (status) filter.status = status
    const total = await Incident.countDocuments(filter)
    const incidents = await Incident.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
    return { success: true, data: incidents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
