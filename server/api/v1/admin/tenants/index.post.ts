import { Tenant } from '../../../../models/Tenant'
import { requireRole } from '../../../../utils/authorize'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['superadmin'])
  const body = await readBody(event)
  const tenant = await Tenant.create(body)
  return { data: tenant }
})
