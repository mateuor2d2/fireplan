import { Simulacro } from '../../../models/Simulacro'
import { getAccessibleCenterIds, canModifyCenter } from '../../../utils/authorize'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const simulacro = await Simulacro.findById(id)
    if (!simulacro) throw createError({ statusCode: 404, message: 'Simulacro not found' })

    if (user.role === 'tenant' && simulacro.tenantId?.toString() !== user.tenantId?.toString()) {
      throw createError({ statusCode: 403, message: 'Access denied' })
    }
    if (user.role === 'centroadmin') {
      const accessibleIds = await getAccessibleCenterIds(event)
      if (!accessibleIds.includes(simulacro.centerId.toString())) {
        throw createError({ statusCode: 403, message: 'Access denied' })
      }
    }

    const updated = await Simulacro.findByIdAndUpdate(id, { $set: body }, { new: true })
    return { success: true, data: updated }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message })
  }
})
