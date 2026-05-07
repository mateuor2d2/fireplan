/**
 * Pause collection configuration for subscriptions
 */
export interface IPauseCollection {
  behavior: 'keep_as_draft' | 'as_invoiced' | 'void'
  resumesAt?: Date
}

/**
 * Subscription interface for QR issue reporting subscriptions
 * Database document for per-plan subscriptions with optional annual discount
 */
export interface ISubscription {
  _id: string
  userId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'expired'
  billingInterval: 'month' | 'year'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  pauseCollection?: IPauseCollection
  canceledAt?: Date
  expiresAt?: Date
  annualPrepaymentDiscount?: number
  amount: number
  currency: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Input interface for creating a new subscription
 */
export interface SubscriptionCreateInput {
  userId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  status?: 'active' | 'past_due' | 'canceled' | 'paused' | 'expired'
  billingInterval: 'month' | 'year'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd?: boolean
  pauseCollection?: IPauseCollection
  annualPrepaymentDiscount?: number
  amount: number
  currency?: string
  metadata?: Record<string, any>
}

/**
 * Input interface for updating an existing subscription
 */
export interface SubscriptionUpdateInput {
  status?: 'active' | 'past_due' | 'canceled' | 'paused' | 'expired'
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  pauseCollection?: IPauseCollection
  metadata?: Record<string, any>
}
