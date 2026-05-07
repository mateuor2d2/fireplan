import { useUserStore } from '../stores/user'

export interface SubscriptionState {
  plan: string
  planName: string
  isActive: boolean
  status: string
  currentPeriodEnd: string | null
  features: string[]
  limits: {
    maxPlans: number | null
    maxUsers: number | null
  }
}

export function useSubscription() {
  const { data, refresh, pending } = useFetch<SubscriptionState>('/api/me/subscription', {
    key: 'me-subscription',
    server: false,
    lazy: true
  })

  const hasFeature = (feature: string) => {
    return data.value?.features?.includes(feature) ?? false
  }

  const isStarter = computed(() => data.value?.plan === 'starter')
  const isProfessional = computed(() => data.value?.plan === 'professional')
  const isEnterprise = computed(() => data.value?.plan === 'enterprise')

  const planName = computed(() => data.value?.planName || 'Starter')
  const isActive = computed(() => data.value?.isActive ?? false)

  const isAdmin = computed(() => {
    const role = useUserStore().user?.role
    console.log('[useSubscription] isAdmin check - role:', role)
    return role === 'admin'
  })

  const canCreatePlan = (currentCount: number) => {
    console.log('[useSubscription] canCreatePlan called - isAdmin:', isAdmin.value, 'currentCount:', currentCount, 'data:', data.value)
    if (isAdmin.value) return true
    const max = data.value?.limits?.maxPlans
    if (max === null) return true
    return currentCount < max
  }

  const canAccessIssues = computed(() => hasFeature('issues_anomalies'))
  const canAccessBudget = computed(() => hasFeature('budget_detailed'))
  const canAccessApi = computed(() => hasFeature('api_access'))
  const canAccessDigitalSignature = computed(() => hasFeature('digital_signature'))

  return {
    subscription: data,
    refresh,
    pending,
    hasFeature,
    isStarter,
    isProfessional,
    isEnterprise,
    canCreatePlan,
    canAccessIssues,
    canAccessBudget,
    canAccessApi,
    canAccessDigitalSignature,
    isAdmin,
    planName,
    isActive
  }
}
