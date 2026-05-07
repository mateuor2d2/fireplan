// Graceful shutdown plugin for Nitro/Nuxt
// Handles SIGTERM/SIGINT signals properly for Render.com and other platforms

import { db } from '~/server/utils/db'

export default defineNitroPlugin((nitroApp) => {
  // Track active connections and requests
  let isShuttingDown = false
  let activeRequests = 0

  // Middleware to track active requests
  nitroApp.hooks.hook('request', () => {
    if (!isShuttingDown) {
      activeRequests++
    }
  })

  nitroApp.hooks.hook('afterResponse', () => {
    activeRequests = Math.max(0, activeRequests - 1)
  })

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string) => {
    console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`)
    isShuttingDown = true

    // Stop accepting new connections
    const server = nitroApp.node?.server
    if (server) {
      server.close(() => {
        console.log('[Shutdown] HTTP server closed')
      })
    }

    // Wait for active requests to complete (max 10 seconds)
    const shutdownTimeout = setTimeout(() => {
      console.log(`[Shutdown] Timeout reached with ${activeRequests} active requests, forcing shutdown`)
      process.exit(1)
    }, 10000)

    // Poll for active requests to complete
    const checkInterval = setInterval(() => {
      if (activeRequests === 0) {
        clearInterval(checkInterval)
        clearTimeout(shutdownTimeout)
        console.log('[Shutdown] All requests completed')
        shutdown()
      } else {
        console.log(`[Shutdown] Waiting for ${activeRequests} active requests...`)
      }
    }, 500)

    // Final shutdown
    const shutdown = async () => {
      try {
        // Close database connection
        const { default: mongoose } = await import('mongoose')
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close()
          console.log('[Shutdown] Database connection closed')
        }

        console.log('[Shutdown] Graceful shutdown complete')
        process.exit(0)
      } catch (error) {
        console.error('[Shutdown] Error during shutdown:', error)
        process.exit(1)
      }
    }
  }

  // Register signal handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  console.log('[GracefulShutdown] Plugin initialized')
})
