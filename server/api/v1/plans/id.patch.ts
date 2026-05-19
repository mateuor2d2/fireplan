import { EmergencyPlan } from '../../../models/EmergencyPlan'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const plan = await EmergencyPlan.findOneAndUpdate({ _id: id, tenantId: user.tenantId || user._id }, { $set: body }, { new: true })
    if (!plan) throw createError({ statusCode: 404, message: 'Plan not found' })
    return { success: true, data: plan }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
