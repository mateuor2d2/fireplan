import { type H3Event } from 'h3'
import { hasFeature, getPlanLimit, PLAN_CONFIGS, type PlanId } from './plans'

export function getSubscription(event: H3Event) {
  return event.context.subscription
}

export function requireFeature(event: H3Event, feature: string): void {
  const sub = getSubscription(event)
  const plan = sub?.plan || 'starter'

  if (!hasFeature(plan, feature)) {
    const planName = PLAN_CONFIGS[plan as PlanId]?.name || plan
    throw createError({
      statusCode: 403,
      statusMessage: `Esta funcionalidad no está incluida en tu plan ${planName}. Actualiza tu suscripción para acceder.`,
      data: { code: 'FEATURE_NOT_AVAILABLE', feature, plan }
    })
  }
}

export function checkFeature(event: H3Event, feature: string): boolean {
  const sub = getSubscription(event)
  return hasFeature(sub?.plan, feature)
}

export function checkPlanLimit(
  event: H3Event,
  limitType: 'maxPlans' | 'maxUsers',
  currentCount: number
): { allowed: boolean; limit: number | null; remaining: number } {
  const user = event.context.user
  if (user?.role === 'admin') {
    return { allowed: true, limit: null, remaining: Infinity }
  }

  const sub = getSubscription(event)
  const limit = getPlanLimit(sub?.plan, limitType)

  if (limit === null) {
    return { allowed: true, limit: null, remaining: Infinity }
  }

  const remaining = limit - currentCount
  return { allowed: remaining > 0, limit, remaining }
}

export function requirePlanLimit(
  event: H3Event,
  limitType: 'maxPlans' | 'maxUsers',
  currentCount: number,
  resourceName: string
): void {
  const user = event.context.user
  if (user?.role === 'admin') return

  const result = checkPlanLimit(event, limitType, currentCount)

  if (!result.allowed) {
    const planName = PLAN_CONFIGS[(getSubscription(event)?.plan || 'starter') as PlanId]?.name || 'Starter'
    throw createError({
      statusCode: 403,
      statusMessage: `Has alcanzado el límite de ${resourceName} para tu plan ${planName}.`,
      data: { code: 'PLAN_LIMIT_REACHED', limit: result.limit, current: currentCount, plan: getSubscription(event)?.plan }
    })
  }
}
