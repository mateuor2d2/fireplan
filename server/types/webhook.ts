import type { Document } from 'mongoose'

export type WebhookEventStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface IWebhookEvent extends Document {
  eventType: string
  payload: any
  status: WebhookEventStatus
  processedAt?: Date
  errorMessage?: string
  createdAt?: Date
  updatedAt?: Date
}
