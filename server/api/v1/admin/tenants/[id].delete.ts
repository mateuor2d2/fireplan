import { Tenant } from '../../../../models/Tenant'
import { requireRole } from '../../../../utils/authorize'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['superadmin'])
  const id = getRouterParam(event, 'id')
  const tenant = await Tenant.findByIdAndDelete(id).lean()
  if (!tenant) throw createError({ statusCode: 404, message: 'Tenant no encontrado' })
  return { message: 'Tenant eliminado' }
})
