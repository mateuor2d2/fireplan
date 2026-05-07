import { Center } from '../../../models/Center'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    
    const id = getRouterParam(event, 'id')
    const center = await Center.findOne({
      _id: id,
      tenantId: user.tenantId
    }).lean()
    
    if (!center) {
      throw createError({ statusCode: 404, statusMessage: 'Center not found' })
    }
    
    return {
      success: true,
      data: center
    }
  } catch (error: any) {
    console.error('Error fetching center:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error fetching center'
    })
  }
})
