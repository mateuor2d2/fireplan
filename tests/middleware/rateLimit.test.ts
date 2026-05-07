// ============================================================================
// Rate Limiting Middleware Tests
// ============================================================================
// Vitest unit tests for rate limiting functionality
//
// Tests cover:
// - Rate limiting enforcement
// - Reset time calculation
// - IP-based tracking
// - Reset functionality
//
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createRateLimitMiddleware,
  resetRateLimit,
  getRateLimitStatus
} from '../../server/middleware/rateLimit'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a minimal mock event for testing
 * The middleware needs node.req and node.res properties
 */
function createMockEvent(ip: string = '127.0.0.1') {
  return {
    node: {
      req: {
        headers: {
          'x-forwarded-for': ip
        },
        socket: {
          remoteAddress: ip
        }
      },
      res: {
        setHeader: vi.fn()
      }
    }
  } as any
}

// ============================================================================
// Rate Limiting Middleware Tests
// ============================================================================

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    // Reset all rate limits before each test
    resetRateLimit('127.0.0.1')
    resetRateLimit('192.168.1.1')
    resetRateLimit('203.0.113.1')
    resetRateLimit('198.51.100.1')
  })

  afterEach(() => {
    // Cleanup after each test
    resetRateLimit('127.0.0.1')
    resetRateLimit('192.168.1.1')
    resetRateLimit('203.0.113.1')
    resetRateLimit('198.51.100.1')
  })

  describe('Rate Limit Store', () => {
    it('should track requests for an IP', async () => {
      const middleware = createRateLimitMiddleware(5, 60000)
      const event = createMockEvent()

      // Make 3 requests
      await middleware(event)
      await middleware(event)
      await middleware(event)

      const status = getRateLimitStatus('127.0.0.1')
      expect(status).toBeDefined()
      expect(status!.count).toBe(3)
    })

    it('should track different IPs separately', async () => {
      const middleware = createRateLimitMiddleware(5, 60000)
      const event1 = createMockEvent('192.168.1.1')
      const event2 = createMockEvent('203.0.113.1')

      // IP1 makes 2 requests
      await middleware(event1)
      await middleware(event1)

      // IP2 makes 3 requests
      await middleware(event2)
      await middleware(event2)
      await middleware(event2)

      const status1 = getRateLimitStatus('192.168.1.1')
      const status2 = getRateLimitStatus('203.0.113.1')

      expect(status1?.count).toBe(2)
      expect(status2?.count).toBe(3)
    })

    it('should return undefined for untracked IP', () => {
      const status = getRateLimitStatus('999.999.999.999')
      expect(status).toBeUndefined()
    })
  })

  describe('Rate Limit Enforcement', () => {
    it('should allow requests within limit', async () => {
      const middleware = createRateLimitMiddleware(3, 60000)
      const event = createMockEvent()

      // Make 3 requests (at limit)
      await middleware(event)
      await middleware(event)
      await middleware(event)

      const status = getRateLimitStatus('127.0.0.1')
      expect(status?.count).toBe(3)
    })

    it('should increment counter with each request', async () => {
      const middleware = createRateLimitMiddleware(10, 60000)
      const event = createMockEvent()

      await middleware(event)
      await middleware(event)
      await middleware(event)

      const status = getRateLimitStatus('127.0.0.1')
      expect(status?.count).toBe(3)
    })

    it('should set correct reset time', async () => {
      const windowMs = 60000 // 1 minute
      const middleware = createRateLimitMiddleware(5, windowMs)
      const event = createMockEvent()

      const beforeCall = Date.now()
      await middleware(event)

      const status = getRateLimitStatus('127.0.0.1')
      expect(status?.resetTime).toBeGreaterThanOrEqual(beforeCall + windowMs - 100)
      expect(status?.resetTime).toBeLessThanOrEqual(beforeCall + windowMs + 100)
    })
  })

  describe('resetRateLimit', () => {
    it('should reset counter for specific IP', async () => {
      const middleware = createRateLimitMiddleware(2, 60000)
      const event = createMockEvent()

      // Make 2 requests (at limit)
      await middleware(event)
      await middleware(event)

      let status = getRateLimitStatus('127.0.0.1')
      expect(status?.count).toBe(2)

      // Reset
      resetRateLimit('127.0.0.1')

      status = getRateLimitStatus('127.0.0.1')
      expect(status).toBeUndefined()
    })

    it('should allow new requests after reset', async () => {
      const middleware = createRateLimitMiddleware(2, 60000)
      const event = createMockEvent()

      // Make 2 requests (at limit)
      await middleware(event)
      await middleware(event)

      // Reset
      resetRateLimit('127.0.0.1')

      // Should be able to make requests again
      await middleware(event)
      await middleware(event)

      const status = getRateLimitStatus('127.0.0.1')
      expect(status?.count).toBe(2)
    })
  })

  describe('IP Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const middleware = createRateLimitMiddleware(1, 60000)
      const event = createMockEvent('198.51.100.1')

      await middleware(event)

      const status = getRateLimitStatus('198.51.100.1')
      expect(status?.count).toBe(1)
    })

    it('should use first IP when multiple in x-forwarded-for', async () => {
      const middleware = createRateLimitMiddleware(1, 60000)
      const event = createMockEvent('203.0.113.1, 198.51.100.1')

      await middleware(event)

      // Should track first IP
      const status = getRateLimitStatus('203.0.113.1')
      expect(status?.count).toBe(1)

      // Second IP should not be tracked
      const status2 = getRateLimitStatus('198.51.100.1')
      expect(status2).toBeUndefined()
    })
  })

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-Limit header', async () => {
      const middleware = createRateLimitMiddleware(10, 60000)
      const event = createMockEvent()

      await middleware(event)

      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '10'
      )
    })

    it('should set X-RateLimit-Remaining header', async () => {
      const middleware = createRateLimitMiddleware(5, 60000)
      const event = createMockEvent()

      await middleware(event)

      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        '4'
      )
    })

    it('should decrement remaining count with each request', async () => {
      const middleware = createRateLimitMiddleware(5, 60000)
      const event = createMockEvent()

      await middleware(event)
      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        '4'
      )

      await middleware(event)
      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        '3'
      )
    })

    it('should set X-RateLimit-Reset header', async () => {
      const middleware = createRateLimitMiddleware(10, 60000)
      const event = createMockEvent()

      await middleware(event)

      expect(event.node.res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(String)
      )
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return current status for tracked IP', async () => {
      const middleware = createRateLimitMiddleware(5, 60000)
      const event = createMockEvent()

      await middleware(event)

      const status = getRateLimitStatus('127.0.0.1')
      expect(status).toBeDefined()
      expect(status!.count).toBe(1)
      expect(status!.resetTime).toBeGreaterThan(Date.now())
    })

    it('should return undefined for untracked IP', () => {
      const status = getRateLimitStatus('non.existent.ip')
      expect(status).toBeUndefined()
    })
  })
})
