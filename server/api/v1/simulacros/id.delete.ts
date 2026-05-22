import { Simulacro } from '../../../models/Simulacro'
import { getAccessibleCenterIds } from '../../../utils/authorize'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
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

    await Simulacro.findByIdAndDelete(id)
    return { success: true, message: 'Simulacro deleted' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message })
  }
})
