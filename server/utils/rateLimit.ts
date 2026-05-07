// ============================================================================
// Rate Limiting Middleware
// ============================================================================
// In-memory rate limiting middleware for verification endpoints
//
// Prevents abuse by limiting requests per IP address
// - 100 verification codes/hour per IP
// - 20 validation attempts/hour per IP
//
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limits (can be replaced with Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

/**
 * Create a rate limiting middleware
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Express/Nuxt middleware function
 */
export function createRateLimitMiddleware(
  maxRequests: number,
  windowMs: number
) {
  return async (event: any) => {
    // Get client IP from request headers
    const ip = event.node?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || event.node?.req?.headers?.['x-real-ip']
      || event.node?.req?.socket?.remoteAddress
      || 'unknown'

    const now = Date.now()
    const entry = rateLimitStore.get(ip)

    // Initialize or reset entry if window has expired
    if (!entry || entry.resetTime < now) {
      const newEntry = {
        count: 1,
        resetTime: now + windowMs
      }
      rateLimitStore.set(ip, newEntry)

      // Add rate limit headers to response
      if (event.node?.res) {
        event.node.res.setHeader('X-RateLimit-Limit', maxRequests.toString())
        event.node.res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - 1).toString())
        event.node.res.setHeader('X-RateLimit-Reset', new Date(newEntry.resetTime).toISOString())
      }
      return
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: `Has excedido el límite de ${maxRequests} solicitudes por hora. Por favor, espera antes de intentar de nuevo.`,
        data: {
          resetTime: new Date(entry.resetTime).toISOString(),
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }
      })
    }

    // Add rate limit headers to response
    if (event.node?.res) {
      event.node.res.setHeader('X-RateLimit-Limit', maxRequests.toString())
      event.node.res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString())
      event.node.res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())
    }
  }
}

/**
 * Rate limiting middleware for verification code generation
 * Limits: 100 codes per hour per IP
 */
export const rateLimitVerification = createRateLimitMiddleware(
  100, // 100 requests
  60 * 60 * 1000 // 1 hour
)

/**
 * Rate limiting middleware for code validation
 * Limits: 20 attempts per hour per IP (stricter to prevent brute force)
 */
export const rateLimitValidate = createRateLimitMiddleware(
  20, // 20 requests
  60 * 60 * 1000 // 1 hour
)

/**
 * Rate limiting middleware for signup/registration
 * Limits: 2 registrations per 24 hours per IP
 */
export const rateLimitSignup = createRateLimitMiddleware(
  2, // 2 registrations
  24 * 60 * 60 * 1000 // 24 hours
)

/**
 * Reset rate limit for a specific IP (for testing purposes)
 * @param ip - IP address to reset
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip)
}

/**
 * Get current rate limit status for an IP
 * @param ip - IP address to check
 * @returns Current rate limit entry or undefined
 */
export function getRateLimitStatus(ip: string): RateLimitEntry | undefined {
  return rateLimitStore.get(ip)
}
