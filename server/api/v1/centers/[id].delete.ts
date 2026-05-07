import { Center } from '../../../models/Center'
import { EmergencyPlan } from '../../../models/EmergencyPlan'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    
    const id = getRouterParam(event, 'id')
    
    // Verificar si tiene planes de emergencia
    const plansCount = await EmergencyPlan.countDocuments({ centerId: id })
    if (plansCount > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot delete center with emergency plans. Delete plans first.'
      })
    }
    
    const center = await Center.findOneAndDelete({
      _id: id,
      tenantId: user.tenantId
    })
    
    if (!center) {
      throw createError({ statusCode: 404, statusMessage: 'Center not found' })
    }
    
    return {
      success: true,
      message: 'Center deleted successfully'
    }
  } catch (error: any) {
    console.error('Error deleting center:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error deleting center'
    })
  }
})
