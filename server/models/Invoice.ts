import type { Document } from 'mongoose'
import { Schema, model } from 'mongoose'

export interface IInvoice extends Document {
  _id: string
  userId: string
  planId: string
  paymentId: string
  stripeInvoiceId: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  description?: string
  customerInfo: {
    name: string
    email: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      postal_code?: string
      country?: string
    }
    taxId?: string
  }
  companyInfo: {
    name: string
    address: {
      line1: string
      line2?: string
      city: string
      postal_code: string
      country: string
    }
    taxId: string
    phone?: string
    email?: string
  }
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  taxAmount: number
  totalAmount: number
  dueDate?: Date
  paidAt?: Date
  voidedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const InvoiceSchema = new Schema<IInvoice>({
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
  paymentId: {
    type: String,
    required: true,
    ref: 'Payment'
  },
  stripeInvoiceId: {
    type: String,
    required: true,
    unique: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
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
    enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
    required: true,
    default: 'draft'
  },
  description: String,
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      postal_code: String,
      country: String
    },
    taxId: String
  },
  companyInfo: {
    name: { type: String, required: true },
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      postal_code: { type: String, required: true },
      country: { type: String, required: true }
    },
    taxId: { type: String, required: true },
    phone: String,
    email: String
  },
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true },
  dueDate: Date,
  paidAt: Date,
  voidedAt: Date
}, {
  timestamps: true
})

// Indexes for better query performance
InvoiceSchema.index({ userId: 1 })
InvoiceSchema.index({ planId: 1 })
InvoiceSchema.index({ paymentId: 1 })
// stripeInvoiceId already indexed by unique: true
// invoiceNumber already indexed by unique: true
InvoiceSchema.index({ status: 1 })
InvoiceSchema.index({ createdAt: -1 })

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema)
