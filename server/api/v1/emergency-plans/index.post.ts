import { EmergencyPlan } from '../../../models/EmergencyPlan'
import { Center } from '../../../models/Center'
import { requireRole } from '../../../utils/authorize'
export default defineEventHandler(async (event) => {
  try {
    const user = requireRole(event, ['tenant', 'superadmin', 'centroadmin'])
    const body = await readBody(event)
    if (!body.centerId) throw createError({ statusCode: 400, message: 'centerId is required' })
    const center = await Center.findById(body.centerId)
    if (!center) throw createError({ statusCode: 404, message: 'Center not found' })
    if (user.role === 'tenant' && center.tenantId?.toString() !== user.tenantId?.toString()) throw createError({ statusCode: 403, message: 'Center does not belong to your tenant' })
    if (user.role === 'centroadmin') { const { getAccessibleCenterIds } = await import('../../../utils/authorize'); const accessibleIds = await getAccessibleCenterIds(event); if (!accessibleIds.includes(body.centerId)) throw createError({ statusCode: 403, message: 'Access denied' }) }
    if (body.status === 'active') { await EmergencyPlan.updateMany({ centerId: body.centerId, status: 'active' }, { $set: { status: 'archived' } }) }
    const plan = new EmergencyPlan({ ...body, tenantId: center.tenantId, createdBy: user._id })
    await plan.save()
    return { success: true, data: plan }
  } catch (error: any) { if (error.statusCode) throw error; throw createError({ statusCode: 500, message: error.message }) }
})
