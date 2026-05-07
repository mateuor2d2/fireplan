import { EmergencyPlan } from '../../../models/EmergencyPlan'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    const plan = await EmergencyPlan.findOne({ _id: id, tenantId: user.tenantId }).lean()
    if (!plan) throw createError({ statusCode: 404, statusMessage: 'Plan not found' })

    return { success: true, data: plan }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
