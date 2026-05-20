import { EquipoContraIncendios } from '../../../models/EquipoContraIncendios'
import { Center } from '../../../models/Center'
import { requireRole } from '../../../utils/authorize'
import crypto from 'crypto'
export default defineEventHandler(async (event) => {
  try {
    const user = requireRole(event, ['tenant', 'superadmin', 'centroadmin'])
    const body = await readBody(event)
    if (!body.centerId) throw createError({ statusCode: 400, message: 'centerId is required' })
    const center = await Center.findById(body.centerId)
    if (!center) throw createError({ statusCode: 404, message: 'Center not found' })
    if (user.role === 'tenant' && center.tenantId?.toString() !== user.tenantId?.toString()) throw createError({ statusCode: 403, message: 'Center does not belong to your tenant' })
    if (user.role === 'centroadmin') { const { getAccessibleCenterIds } = await import('../../../utils/authorize'); const accessibleIds = await getAccessibleCenterIds(event); if (!accessibleIds.includes(body.centerId)) throw createError({ statusCode: 403, message: 'Access denied' }) }
    const qrPrefix = 'FP'
    const qrRandom = crypto.randomBytes(6).toString('hex').toUpperCase()
    const codigoQR = `${qrPrefix}-${body.tipo?.toUpperCase()?.substring(0,3) || 'EQP'}-${qrRandom}`
    const equipo = new EquipoContraIncendios({ ...body, tenantId: center.tenantId, codigoQR })
    await equipo.save()
    return { success: true, data: equipo }
  } catch (error: any) { if (error.statusCode) throw error; throw createError({ statusCode: 500, message: error.message }) }
})
