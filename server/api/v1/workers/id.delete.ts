import { Worker } from '../../../models/Worker'
import { getAccessibleCenterIds } from '../../../utils/authorize'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const id = getRouterParam(event, 'id')
    const worker = await Worker.findById(id)
    if (!worker) throw createError({ statusCode: 404, message: 'Worker not found' })

    if (user.role === 'tenant' && worker.tenantId?.toString() !== user.tenantId?.toString()) {
      throw createError({ statusCode: 403, message: 'Access denied' })
    }
    if (user.role === 'centroadmin') {
      const accessibleIds = await getAccessibleCenterIds(event)
      const workerCenterIds = worker.centers.map((c: any) => c.centerId.toString())
      const hasAccess = workerCenterIds.some((cid: string) => accessibleIds.includes(cid))
      if (!hasAccess) throw createError({ statusCode: 403, message: 'Access denied' })
    }

    await Worker.findByIdAndDelete(id)
    return { success: true, message: 'Worker deleted' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message })
  }
})
