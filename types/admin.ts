/**
 * Admin pricing configuration types
 */

export interface PricingConfig {
  planPrice: number // Price in cents (e.g., 2900 = €29.00)
  defaultPrecioPSS: number // Price in cents (e.g., 99 = €0.99)
  currency: string // Currency code (e.g., 'EUR')
  planPriceEur: number // Price in euros for display
  defaultPrecioPSSEur: number // Price in euros for display
}
