// Simple health check - always returns 200 OK
// This is critical for Render.com health checks
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  }
})
