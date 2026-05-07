import { sseManager } from '../../utils/sse'

export default defineEventHandler(async (event) => {
  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'X-Accel-Buffering': 'no'
  })

  // Get user from authentication
  const user = event.context.user
  console.log('SSE endpoint - user from context:', user ? `${user._id} (${user.email})` : 'No user')

  if (!user || !user._id) {
    console.log('SSE endpoint - authentication failed')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const userId = user._id.toString()
  console.log(`SSE connection requested for user: ${userId}`)

  // Get the response object
  const response = event.node.res

  // Send initial connection event
  const initialMessage = `event: connected\ndata: ${JSON.stringify({
    userId,
    timestamp: new Date().toISOString(),
    message: 'SSE connection established'
  })}\n\n`

  try {
    response.write(initialMessage)
    console.log(`Initial SSE message sent for user: ${userId}`)
  } catch (error) {
    console.error('Error sending initial SSE message:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to establish SSE connection'
    })
  }

  // Add connection to manager
  sseManager.addConnection(userId, response)
  console.log(`SSE connection established for user: ${userId}`)

  // Handle connection close
  const handleDisconnect = () => {
    console.log(`SSE connection closed for user: ${userId}`)
    sseManager.removeConnection(userId, response)
  }

  // Listen for connection close events
  response.on('close', handleDisconnect)
  event.node.req.on('close', handleDisconnect)

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    try {
      const heartbeatMessage = `event: heartbeat\ndata: ${JSON.stringify({
        timestamp: new Date().toISOString()
      })}\n\n`
      response.write(heartbeatMessage)
      console.log(`Heartbeat sent for user: ${userId}`)
    } catch (error) {
      console.error('Error sending heartbeat:', error)
      clearInterval(heartbeatInterval)
      sseManager.removeConnection(userId, response)
    }
  }, 30000)

  // Return a promise that never resolves to keep the connection open
  return new Promise<void>((resolve) => {
    // Clean up when connection is closed
    response.on('close', () => {
      clearInterval(heartbeatInterval)
      sseManager.removeConnection(userId, response)
      resolve() // Resolve the promise to clean up
    })
  })
})
