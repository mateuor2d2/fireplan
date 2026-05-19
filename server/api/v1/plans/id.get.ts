import { EmergencyPlan } from '../../../models/EmergencyPlan'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const id = getRouterParam(event, 'id')
    const plan = await EmergencyPlan.findOne({ _id: id, tenantId: user.tenantId || user._id })
    if (!plan) throw createError({ statusCode: 404, message: 'Plan not found' })
    return { success: true, data: plan }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
