import type { Document } from 'mongoose'

export interface ISubscription extends Document {
  userId: string
  planId: string
  status: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  billingInterval?: string
  cancelAtPeriodEnd?: boolean
  pauseCollection?: any
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  createdAt?: Date
  updatedAt?: Date
}
