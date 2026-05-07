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
    const body = await readBody(event)
    
    const center = await Center.findOneAndUpdate(
      { _id: id, tenantId: user.tenantId },
      { $set: body },
      { new: true }
    )
    
    if (!center) {
      throw createError({ statusCode: 404, statusMessage: 'Center not found' })
    }
    
    return {
      success: true,
      data: center,
      message: 'Center updated successfully'
    }
  } catch (error: any) {
    console.error('Error updating center:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error updating center'
    })
  }
})
