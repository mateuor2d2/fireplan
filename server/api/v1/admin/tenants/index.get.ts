import { Tenant } from '../../../../models/Tenant'
import { requireRole } from '../../../../utils/authorize'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['superadmin'])
  const tenants = await Tenant.find().sort({ createdAt: -1 }).lean()
  return { data: tenants }
})
