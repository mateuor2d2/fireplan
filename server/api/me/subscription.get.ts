import { getPlanConfig, PLAN_CONFIGS } from '../../utils/plans'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  // Admin bypass: unlimited access regardless of subscription
  if (user.role === 'admin') {
    const enterpriseConfig = getPlanConfig('enterprise')
    return {
      plan: 'enterprise',
      planName: 'Admin (sin límites)',
      isActive: true,
      status: 'active',
      currentPeriodEnd: null,
      features: enterpriseConfig.features,
      limits: {
        maxPlans: null,
        maxUsers: null
      }
    }
  }

  const now = new Date()
  const isActive = user.subscriptionStatus === 'active'
    && user.subscriptionCurrentPeriodEnd
    && new Date(user.subscriptionCurrentPeriodEnd) > now

  const effectivePlan = isActive ? (user.plan || 'starter') : 'starter'
  const config = getPlanConfig(effectivePlan)

  return {
    plan: effectivePlan,
    planName: config.name,
    isActive,
    status: user.subscriptionStatus || 'inactive',
    currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
    features: config.features,
    limits: {
      maxPlans: config.maxPlans,
      maxUsers: config.maxUsers
    }
  }
})
