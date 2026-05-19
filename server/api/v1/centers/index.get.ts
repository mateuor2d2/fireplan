import { Center } from '../../../models/Center'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const status = query.status as string
    const search = query.search as string

    const filter: any = { tenantId: user.tenantId || user._id }
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { activity: { $regex: search, $options: 'i' } },
        { sector: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await Center.countDocuments(filter)
    const centers = await Center.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return {
      success: true,
      data: centers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message })
  }
})
