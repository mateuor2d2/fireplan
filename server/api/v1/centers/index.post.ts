import { Center } from '../../../models/Center'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    
    const body = await readBody(event)
    
    const center = new Center({
      ...body,
      tenantId: user.tenantId,
      createdBy: user._id
    })
    
    await center.save()
    
    return {
      success: true,
      data: center,
      message: 'Center created successfully'
    }
  } catch (error: any) {
    console.error('Error creating center:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error creating center'
    })
  }
})
