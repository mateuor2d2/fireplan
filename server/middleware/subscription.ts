import { getPlanConfig, hasFeature, getPlanLimit, type PlanConfig } from '../utils/plans'

export interface SubscriptionContext {
  plan: string
  config: PlanConfig
  features: string[]
  isActive: boolean
  currentPeriodEnd: Date | null
}

declare module 'h3' {
  interface H3EventContext {
    subscription?: SubscriptionContext
  }
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // Skip public routes and webhooks
  if (
    !url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/api/auth/')
    || url.pathname.startsWith('/api/webhooks/')
    || url.pathname.startsWith('/api/public/')
  ) {
    return
  }

  const user = event.context.user
  if (!user) {
    return
  }

  const now = new Date()
  const isActive = user.subscriptionStatus === 'active'
    && user.subscriptionCurrentPeriodEnd
    && new Date(user.subscriptionCurrentPeriodEnd) > now

  // If no active paid subscription, enforce starter
  const effectivePlan = isActive ? (user.plan || 'starter') : 'starter'
  const config = getPlanConfig(effectivePlan) || { features: [], limits: {} }

  event.context.subscription = {
    plan: effectivePlan,
    config,
    features: config.features,
    isActive,
    currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null
  }
})
