/**
 * Pricing configuration
 *
 * Default prices for the application.
 * In production, these should be loaded from database or environment config.
 */

export interface PricingConfig {
  // Price in cents for one-time safety plan payment
  planPrice: number // e.g., 2900 = €29.00

  // Default price per unit for user customization (user.precioPSS)
  defaultPrecioPSS: number // e.g., 99 = €0.99

  // Currency code
  currency: string // e.g., 'EUR'

  // Display values in euros
  planPriceEur: number // e.g., 29.00
  defaultPrecioPSSEur: number // e.g., 0.99
}

/**
 * Default pricing configuration
 *
 * TODO: Load from database or environment variables
 */
export const defaultPricing: PricingConfig = {
  planPrice: 2900, // €29.00
  defaultPrecioPSS: 99, // €0.99
  currency: 'EUR',
  planPriceEur: 29.00,
  defaultPrecioPSSEur: 0.99
}

/**
 * Get current pricing configuration
 *
 * In production, this should fetch from database/config
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  // TODO: Load from database or environment config
  // For now, return defaults
  return defaultPricing
}

/**
 * Format price in euros from cents
 */
export function formatPriceEur(cents: number): number {
  return cents / 100
}
