import { EmergencyPlan } from '../../../models/EmergencyPlan'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const plan = await EmergencyPlan.findOneAndUpdate(
      { _id: id, tenantId: user.tenantId },
      { $set: body },
      { new: true }
    )
    if (!plan) throw createError({ statusCode: 404, statusMessage: 'Plan not found' })

    return { success: true, data: plan, message: 'Plan updated successfully' }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
