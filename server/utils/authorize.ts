import type { H3Event } from 'h3'
import { User } from '../models/User'
import { Center } from '../models/Center'
import { Worker } from '../models/Worker'

export type UserRole = 'user' | 'centroadmin' | 'tenant' | 'superadmin'

export function requireRole(event: H3Event, allowedRoles: UserRole[]) {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  if (!allowedRoles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions' })
  }
  return user
}

export async function getAccessibleCenterIds(event: H3Event): Promise<string[]> {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  if (user.role === 'superadmin') {
    const allCenters = await Center.find({}, '_id')
    return allCenters.map(c => c._id.toString())
  }
  if (user.role === 'tenant') {
    const tenantCenters = await Center.find({ tenantId: user.tenantId }, '_id')
    return tenantCenters.map(c => c._id.toString())
  }
  if (user.role === 'centroadmin') {
    const worker = await Worker.findOne({ userId: user._id.toString() })
    if (worker) {
      return worker.centers.map(c => c.centerId.toString())
    }
    return user.assignedCenters?.map((id: any) => id.toString()) || []
  }
  return user.assignedCenters?.map((id: any) => id.toString()) || []
}

export async function canAccessCenter(event: H3Event, centerId: string): Promise<boolean> {
  const accessibleIds = await getAccessibleCenterIds(event)
  return accessibleIds.includes(centerId)
}

export async function canModifyCenter(event: H3Event, centerId: string): Promise<boolean> {
  const user = event.context.user
  if (!user) return false
  if (user.role === 'superadmin') return true
  if (user.role === 'tenant') {
    const center = await Center.findById(centerId)
    return center?.tenantId?.toString() === user.tenantId?.toString()
  }
  if (user.role === 'centroadmin') {
    const accessibleIds = await getAccessibleCenterIds(event)
    return accessibleIds.includes(centerId)
  }
  return false
}
