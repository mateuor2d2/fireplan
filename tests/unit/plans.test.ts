// tests/unit/plans.test.ts
// Contracts: C6-C9 (plan limits), C14-C15 (plan features)
import { describe, it, expect } from 'vitest'
import {
  getPlanConfig,
  hasFeature,
  getPlanLimit,
  PLAN_CONFIGS
} from '../../server/utils/plans'

describe('getPlanConfig', () => {
  it('returns starter config for undefined plan', () => {
    const config = getPlanConfig(undefined)
    expect(config.id).toBe('starter')
    expect(config.maxPlans).toBe(1)
    expect(config.maxUsers).toBe(1)
    expect(config.priceMonthly).toBe(0)
  })

  it('returns starter config for starter plan', () => {
    const config = getPlanConfig('starter')
    expect(config.id).toBe('starter')
    expect(config.name).toBe('Starter')
  })

  it('returns professional config', () => {
    const config = getPlanConfig('professional')
    expect(config.id).toBe('professional')
    expect(config.maxPlans).toBe(5)
    expect(config.maxUsers).toBe(3)
    expect(config.priceMonthly).toBe(79)
    expect(config.priceYearly).toBe(790)
  })

  it('returns enterprise config', () => {
    const config = getPlanConfig('enterprise')
    expect(config.id).toBe('enterprise')
    expect(config.maxPlans).toBeNull()
    expect(config.maxUsers).toBeNull()
    expect(config.priceMonthly).toBe(179)
    expect(config.priceYearly).toBe(1790)
  })

  it('falls back to starter for unknown plan', () => {
    const config = getPlanConfig('unknown_plan')
    expect(config.id).toBe('starter')
  })
})

describe('hasFeature', () => {
  it('starter has create_plan', () => {
    expect(hasFeature('starter', 'create_plan')).toBe(true)
  })

  it('starter has export_pdf', () => {
    expect(hasFeature('starter', 'export_pdf')).toBe(true)
  })

  it('starter does NOT have export_print', () => {
    expect(hasFeature('starter', 'export_print')).toBe(false)
  })

  it('professional has export_print', () => {
    expect(hasFeature('professional', 'export_print')).toBe(true)
  })

  it('enterprise has digital_signature', () => {
    expect(hasFeature('enterprise', 'digital_signature')).toBe(true)
  })

  it('professional does NOT have digital_signature', () => {
    expect(hasFeature('professional', 'digital_signature')).toBe(false)
  })

  it('undefined plan falls back to starter features', () => {
    expect(hasFeature(undefined, 'create_plan')).toBe(true)
    expect(hasFeature(undefined, 'export_print')).toBe(false)
  })
})

describe('getPlanLimit', () => {
  it('starter maxPlans = 1', () => {
    expect(getPlanLimit('starter', 'maxPlans')).toBe(1)
  })

  it('starter maxUsers = 1', () => {
    expect(getPlanLimit('starter', 'maxUsers')).toBe(1)
  })

  it('professional maxPlans = 5', () => {
    expect(getPlanLimit('professional', 'maxPlans')).toBe(5)
  })

  it('professional maxUsers = 3', () => {
    expect(getPlanLimit('professional', 'maxUsers')).toBe(3)
  })

  it('enterprise maxPlans = null (unlimited)', () => {
    expect(getPlanLimit('enterprise', 'maxPlans')).toBeNull()
  })

  it('enterprise maxUsers = null (unlimited)', () => {
    expect(getPlanLimit('enterprise', 'maxUsers')).toBeNull()
  })

  it('undefined plan returns starter limits', () => {
    expect(getPlanLimit(undefined, 'maxPlans')).toBe(1)
  })
})

describe('canCreatePlan logic (simulated from useSubscription)', () => {
  function canCreatePlan(isAdmin: boolean, maxPlans: number | null, currentCount: number): boolean {
    if (isAdmin) return true
    if (maxPlans === null) return true
    return currentCount < maxPlans
  }

  // C6: Starter can create 1 plan
  it('starter can create first plan (count=0)', () => {
    const max = getPlanLimit('starter', 'maxPlans')!
    expect(canCreatePlan(false, max, 0)).toBe(true)
  })

  // C7: Starter blocked at 1 plan
  it('starter CANNOT create second plan (count=1)', () => {
    const max = getPlanLimit('starter', 'maxPlans')!
    expect(canCreatePlan(false, max, 1)).toBe(false)
  })

  // C8: Professional up to 5
  it('professional can create 5th plan (count=4)', () => {
    const max = getPlanLimit('professional', 'maxPlans')!
    expect(canCreatePlan(false, max, 4)).toBe(true)
  })

  it('professional CANNOT create 6th plan (count=5)', () => {
    const max = getPlanLimit('professional', 'maxPlans')!
    expect(canCreatePlan(false, max, 5)).toBe(false)
  })

  // C9: Enterprise unlimited
  it('enterprise can create any number of plans', () => {
    const max = getPlanLimit('enterprise', 'maxPlans')
    expect(canCreatePlan(false, max, 100)).toBe(true)
  })

  it('admin bypasses all limits', () => {
    const max = getPlanLimit('starter', 'maxPlans')!
    expect(canCreatePlan(true, max, 999)).toBe(true)
  })
})

describe('pricing structure', () => {
  it('all plans have correct monthly prices', () => {
    expect(PLAN_CONFIGS.starter.priceMonthly).toBe(0)
    expect(PLAN_CONFIGS.professional.priceMonthly).toBe(79)
    expect(PLAN_CONFIGS.enterprise.priceMonthly).toBe(179)
  })

  it('yearly prices give ~2 months free', () => {
    expect(PLAN_CONFIGS.professional.priceYearly).toBe(790)
    expect(PLAN_CONFIGS.enterprise.priceYearly).toBe(1790)
    expect(PLAN_CONFIGS.starter.priceYearly).toBe(0)
  })

  it('only enterprise has api_access and onboarding', () => {
    expect(hasFeature('enterprise', 'api_access')).toBe(true)
    expect(hasFeature('enterprise', 'onboarding')).toBe(true)
    expect(hasFeature('professional', 'api_access')).toBe(false)
    expect(hasFeature('starter', 'api_access')).toBe(false)
  })
})
