/**
 * Invoice type definitions
 */

export interface IInvoice {
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
  hosted_invoice_url?: string
  createdAt: Date
  updatedAt: Date
}
