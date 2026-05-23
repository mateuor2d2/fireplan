import { Tenant } from '../../../../models/Tenant'
import { requireRole } from '../../../../utils/authorize'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['superadmin'])
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const tenant = await Tenant.findByIdAndUpdate(id, body, { new: true }).lean()
  if (!tenant) throw createError({ statusCode: 404, message: 'Tenant no encontrado' })
  return { data: tenant }
})
