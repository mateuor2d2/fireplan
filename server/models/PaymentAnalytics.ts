import type { Document } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface IPaymentAnalytics extends Document {
  _id: string
  userId: string
  planId: string
  sessionId: string
  event: 'checkout_started' | 'payment_modal_opened' | 'payment_attempted' | 'payment_succeeded' | 'payment_failed' | 'payment_cancelled' | 'checkout_completed'
  eventData: {
    amount?: number
    currency?: string
    paymentMethod?: string
    errorCode?: string
    errorMessage?: string
    processingTime?: number
    deviceType?: 'desktop' | 'mobile' | 'tablet'
    browser?: string
    os?: string
    timestamp: Date
    metadata?: Record<string, any>
  }
  createdAt: Date
  updatedAt: Date
}

const PaymentAnalyticsSchema = new Schema<IPaymentAnalytics>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  planId: {
    type: String,
    required: true,
    ref: 'Plan'
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    enum: ['checkout_started', 'payment_modal_opened', 'payment_attempted', 'payment_succeeded', 'payment_failed', 'payment_cancelled', 'checkout_completed']
  },
  eventData: {
    amount: Number,
    currency: { type: String, default: 'eur' },
    paymentMethod: String,
    errorCode: String,
    errorMessage: String,
    processingTime: Number,
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: String,
    os: String,
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  }
}, {
  timestamps: true
})

// Indexes for better query performance
PaymentAnalyticsSchema.index({ userId: 1, createdAt: -1 })
PaymentAnalyticsSchema.index({ planId: 1, createdAt: -1 })
PaymentAnalyticsSchema.index({ sessionId: 1, createdAt: 1 })
PaymentAnalyticsSchema.index({ event: 1, createdAt: -1 })
PaymentAnalyticsSchema.index({ 'eventData.deviceType': 1 })
PaymentAnalyticsSchema.index({ 'eventData.paymentMethod': 1 })
PaymentAnalyticsSchema.index({ createdAt: -1 })

export const PaymentAnalytics = model<IPaymentAnalytics>('PaymentAnalytics', PaymentAnalyticsSchema)
