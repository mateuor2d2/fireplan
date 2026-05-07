// Stub - reemplazar con lógica real de FirePlan
export type PlanId = 'free' | 'basic' | 'pro' | 'enterprise'

export interface PlanConfig {
  id: PlanId
  name: string
  features: string[]
  limits: Record<string, number>
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    features: ['centers:1', 'plans:1', 'incidents:basic', 'drills:basic'],
    limits: { centers: 1, plans: 1, users: 3, incidents: 50 }
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    features: ['centers:5', 'plans:5', 'incidents:full', 'drills:full', 'telegram'],
    limits: { centers: 5, plans: 5, users: 10, incidents: 500 }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    features: ['centers:unlimited', 'plans:unlimited', 'incidents:full', 'drills:full', 'telegram', 'jornada', 'analytics'],
    limits: { centers: 999, plans: 999, users: 50, incidents: 9999 }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    features: ['centers:unlimited', 'plans:unlimited', 'incidents:full', 'drills:full', 'telegram', 'jornada', 'analytics', 'api', 'white-label'],
    limits: { centers: 9999, plans: 9999, users: 999, incidents: 99999 }
  }
}

export function getPlanConfig(planId: string): PlanConfig | null {
  return PLAN_CONFIGS[planId as PlanId] || null
}

export function hasFeature(planId: string, feature: string): boolean {
  const config = getPlanConfig(planId)
  if (!config) return false
  return config.features.includes(feature) || config.features.some(f => f.startsWith(feature + ':'))
}

export function getPlanLimit(planId: string, limit: string): number {
  const config = getPlanConfig(planId)
  if (!config) return 0
  return config.limits[limit] || 0
}
