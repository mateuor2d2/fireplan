import { EmergencyPlan } from '../../../models/EmergencyPlan'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const body = await readBody(event)
    const plan = new EmergencyPlan({ ...body, tenantId: user.tenantId || user._id })
    await plan.save()
    return { success: true, data: plan }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
