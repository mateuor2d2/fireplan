import type { ISubscription } from '../types/subscription'
import { Schema, model } from 'mongoose'

/**
 * Subscription Schema for QR issue reporting subscriptions
 *
 * Tracks per-plan monthly subscriptions with optional annual prepayment discounts.
 * Supports all Stripe subscription statuses and enforces efficient queries via indexes.
 */
const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    description: 'User who owns the subscription'
  },
  planId: {
    type: String,
    required: true,
    ref: 'Plan',
    description: 'Plan this subscription provides QR access for'
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    description: 'Stripe subscription ID for webhook lookups'
  },
  stripeCustomerId: {
    type: String,
    required: true,
    description: 'Stripe customer ID for payment methods'
  },
  stripePriceId: {
    type: String,
    required: true,
    description: 'Stripe price ID for billing amount'
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'paused', 'expired'],
    required: true,
    default: 'active',
    description: 'Subscription status from Stripe'
  },
  billingInterval: {
    type: String,
    enum: ['month', 'year'],
    required: true,
    description: 'Billing frequency (monthly or yearly)'
  },
  currentPeriodStart: {
    type: Date,
    required: true,
    description: 'Start of current billing period'
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
    description: 'End of current billing period (renewal date)'
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
    description: 'Whether subscription will cancel at period end'
  },
  pauseCollection: {
    type: {
      behavior: {
        type: String,
        enum: ['keep_as_draft', 'as_invoiced', 'void'],
        description: 'Pause collection behavior from Stripe'
      },
      resumesAt: {
        type: Date,
        description: 'Timestamp when paused subscription will resume'
      }
    },
    description: 'Pause collection configuration for paused subscriptions'
  },
  canceledAt: {
    type: Date,
    description: 'Timestamp when cancellation was requested'
  },
  expiresAt: {
    type: Date,
    description: 'Timestamp when subscription access expires (for canceled/expired subs)'
  },
  annualPrepaymentDiscount: {
    type: Number,
    min: 10,
    max: 20,
    description: 'Annual prepayment discount percentage (10-20%)'
  },
  amount: {
    type: Number,
    required: true,
    description: 'Subscription amount in currency units (e.g., euros)'
  },
  currency: {
    type: String,
    required: true,
    default: 'eur',
    description: 'Currency code (ISO 4217)'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
    description: 'Additional metadata from Stripe or application'
  }
}, {
  timestamps: true
})

// Indexes for query performance
// Index for finding user's plan subscriptions (most common query)
SubscriptionSchema.index({ userId: 1, planId: 1 })

// Index for webhook lookups - already created by unique: true on field definition
// No need to duplicate index - stripeSubscriptionId has unique: true

// Index for filtering by status (active, past_due, etc.)
SubscriptionSchema.index({ status: 1 })

// Index for upcoming renewal queries (cron jobs, notifications)
SubscriptionSchema.index({ currentPeriodEnd: 1 })

// Index for history views (most recent first)
SubscriptionSchema.index({ createdAt: -1 })

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema)
