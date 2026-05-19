import { Center } from '../../../models/Center'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const body = await readBody(event)
    const center = new Center({
      ...body,
      tenantId: user.tenantId || user._id
    })
    await center.save()

    return { success: true, data: center }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message })
  }
})
