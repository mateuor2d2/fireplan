import { Incident } from '../../../models/Incident'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const id = getRouterParam(event, 'id')
    const incident = await Incident.findOne({ _id: id, tenantId: user.tenantId || user._id })
    if (!incident) throw createError({ statusCode: 404, message: 'Incident not found' })
    return { success: true, data: incident }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
