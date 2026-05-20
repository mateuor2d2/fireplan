import { Worker } from '../../../models/Worker'
import { requireRole } from '../../../utils/authorize'
export default defineEventHandler(async (event) => {
  try {
    const user = requireRole(event, ['tenant', 'superadmin', 'centroadmin'])
    const body = await readBody(event)
    const tenantId = user.role === 'superadmin' ? body.tenantId : user.tenantId
    if (!tenantId) throw createError({ statusCode: 400, message: 'tenantId is required' })
    if (user.role === 'centroadmin') {
      const { getAccessibleCenterIds } = await import('../../../utils/authorize')
      const accessibleIds = await getAccessibleCenterIds(event)
      const requestedCenterIds = (body.centers || []).map((c: any) => typeof c.centerId === 'string' ? c.centerId : c.centerId?.toString())
      const canAssignAll = requestedCenterIds.every((id: string) => accessibleIds.includes(id))
      if (!canAssignAll) throw createError({ statusCode: 403, message: 'Cannot assign worker to unauthorized center' })
    }
    const worker = new Worker({ ...body, tenantId })
    await worker.save()
    return { success: true, data: worker }
  } catch (error: any) { if (error.statusCode) throw error; throw createError({ statusCode: 500, message: error.message }) }
})
