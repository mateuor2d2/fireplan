import { Simulacro } from '../../../models/Simulacro'
import { getAccessibleCenterIds } from '../../../utils/authorize'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    const filter: any = { _id: id }

    if (user.role === 'superadmin') { }
    else if (user.role === 'tenant') { filter.tenantId = user.tenantId }
    else {
      const accessibleIds = await getAccessibleCenterIds(event)
      if (accessibleIds.length === 0) throw createError({ statusCode: 403, message: 'Access denied' })
      filter.centerId = { $in: accessibleIds }
    }

    const simulacro = await Simulacro.findOne(filter)
    if (!simulacro) throw createError({ statusCode: 404, message: 'Simulacro not found' })

    return { success: true, data: simulacro }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message })
  }
})
