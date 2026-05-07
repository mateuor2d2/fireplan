import { Center } from '../../../models/Center'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const search = query.search as string
    
    const filter: any = { tenantId: user.tenantId }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    }
    
    const [centers, total] = await Promise.all([
      Center.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Center.countDocuments(filter)
    ])
    
    return {
      success: true,
      data: centers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  } catch (error: any) {
    console.error('Error fetching centers:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error fetching centers'
    })
  }
})
