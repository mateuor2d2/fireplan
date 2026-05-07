import type { H3Event } from 'h3'

/**
 * Define Event Handler Wrapper
 *
 * Creates a standardized H3 event handler with error handling.
 * This is a helper wrapper for API endpoints that handle H3 events.
 *
 * @param handler - The event handler function
 * @returns A configured H3 event handler
 */
export function defineApiEventHandler<T = any>(
  handler: (event: H3Event) => Promise<void>
): (event: H3Event) => Promise<void> {
  return async (event: H3Event) => {
    try {
      await handler(event)
    } catch (error) {
      console.error('Event handler error:', error)

      // H3 error responses
      throw error
    }
  }
}
