import { Incident } from '../../../models/Incident'
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const body = await readBody(event)
    const code = 'INC-' + Date.now()
    const incident = new Incident({ ...body, code, tenantId: user.tenantId || user._id })
    await incident.save()
    return { success: true, data: incident }
  } catch (error: any) { throw createError({ statusCode: 500, message: error.message }) }
})
