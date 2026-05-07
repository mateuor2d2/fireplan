import type { Document } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface IPayment extends Document {
  _id: string
  userId: string
  planId: string
  stripePaymentIntentId: string
  stripeInvoiceId?: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  paymentMethod?: string
  description?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>({
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
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  stripeInvoiceId: {
    type: String,
    sparse: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'eur'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'],
    required: true,
    default: 'pending'
  },
  paymentMethod: String,
  description: String,
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes for better query performance
PaymentSchema.index({ userId: 1, planId: 1 })
// stripePaymentIntentId already indexed by unique: true
PaymentSchema.index({ status: 1 })
PaymentSchema.index({ createdAt: -1 })

export const Payment = model<IPayment>('Payment', PaymentSchema)
