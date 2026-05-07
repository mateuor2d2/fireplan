/**
 * Webhook event status enum representing processing state
 * Tracks lifecycle from receipt through processing to completion/failure
 */
export type WebhookEventStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Webhook event interface for Stripe webhook logging
 * Provides idempotency via eventId tracking and debugging visibility via full payload storage
 */
export interface IWebhookEvent {
  _id: string
  /**
   * Stripe event ID (unique identifier from Stripe)
   * Used for idempotency checking to prevent duplicate processing
   */
  eventId: string
  /**
   * Event type from Stripe (e.g., 'checkout.session.completed', 'customer.subscription.created')
   * Used for filtering and analyzing webhook patterns
   */
  type: string
  /**
   * Current processing status of the webhook event
   * pending → received but not yet processed
   * processing → currently being handled
   * completed → successfully processed
   * failed → processing encountered an error
   */
  status: WebhookEventStatus
  /**
   * Full event payload from Stripe
   * Stored for debugging and replay capabilities
   */
  data: any
  /**
   * Error message if processing failed
   * Provides diagnostic information for failed webhooks
   */
  error?: string
  /**
   * Timestamp when webhook was received from Stripe
   * Used for TTL cleanup and temporal queries
   */
  receivedAt: Date
  /**
   * Timestamp when processing completed
   * Null for pending/processing events
   */
  processedAt?: Date
  /**
   * Document creation timestamp (auto-managed by Mongoose)
   */
  createdAt: Date
  /**
   * Document last update timestamp (auto-managed by Mongoose)
   */
  updatedAt: Date
}
