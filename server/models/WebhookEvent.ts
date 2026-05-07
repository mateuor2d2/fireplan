import type { IWebhookEvent, WebhookEventStatus } from '../types/webhook'
import { Schema, model } from 'mongoose'

/**
 * Webhook Event Schema for Stripe webhook logging and idempotency
 *
 * Stores all received Stripe webhook events to prevent duplicate processing
 * via unique eventId constraint. Provides debugging visibility through full
 * payload storage and error tracking.
 *
 * TTL index automatically cleans up events after 30 days to manage storage.
 */
const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId: {
    type: String,
    required: true,
    unique: true,
    description: 'Stripe event ID for idempotency (prevents duplicate processing)'
  },
  type: {
    type: String,
    required: true,
    description: 'Event type from Stripe (e.g., checkout.session.completed)'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'] as WebhookEventStatus[],
    required: true,
    default: 'pending',
    description: 'Current processing status of the webhook event'
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
    description: 'Full event payload from Stripe for debugging'
  },
  error: {
    type: String,
    required: false,
    description: 'Error message if processing failed'
  },
  receivedAt: {
    type: Date,
    required: true,
    description: 'Timestamp when webhook was received from Stripe'
  },
  processedAt: {
    type: Date,
    required: false,
    description: 'Timestamp when processing completed'
  }
}, {
  timestamps: true
})

// Indexes for query performance and data management

// Unique index on eventId (enforced by schema unique: true)
// This provides idempotency - duplicate Stripe events are rejected

// Index for filtering by event type (e.g., all checkout.session.completed events)
WebhookEventSchema.index({ type: 1 })

// Index for filtering by status (e.g., all failed events for retry/monitoring)
WebhookEventSchema.index({ status: 1 })

// Index for temporal queries (e.g., recent events, time-based analytics)
WebhookEventSchema.index({ receivedAt: -1 })

// Compound index for querying recent events of a specific type
// Common pattern: "show me the last 10 checkout.session.completed events"
WebhookEventSchema.index({ type: 1, receivedAt: -1 })

// TTL index to automatically delete events after 30 days
// 30 days = 30 * 24 * 60 * 60 = 2592000 seconds
WebhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 2592000, name: 'webhook_event_ttl' })

export const WebhookEvent = model<IWebhookEvent>('WebhookEvent', WebhookEventSchema)
