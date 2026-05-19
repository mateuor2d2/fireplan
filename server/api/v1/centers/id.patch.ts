import { Center } from '../../../models/Center'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const center = await Center.findOneAndUpdate(
      { _id: id, tenantId: user.tenantId || user._id },
      { $set: body },
      { new: true }
    )

    if (!center) {
      throw createError({ statusCode: 404, message: 'Center not found' })
    }

    return { success: true, data: center }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message })
  }
})
