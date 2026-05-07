// SSE Connection Manager
export interface SSEConnection {
  userId: string
  response: unknown
  lastHeartbeat: Date
}

class SSEManager {
  private connections: Map<string, SSEConnection[]> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startHeartbeat()
  }

  // Add a new connection
  addConnection(userId: string, response: unknown): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, [])
    }

    const connection: SSEConnection = {
      userId,
      response,
      lastHeartbeat: new Date()
    }

    this.connections.get(userId)!.push(connection)
    console.log(`SSE connection added for user ${userId}, total connections: ${this.connections.get(userId)!.length}`)

    // Log all current connections for debugging
    console.log('Current SSE connections:', Array.from(this.connections.entries()).map(([uid, conns]) => ({
      userId: uid,
      connectionCount: conns.length
    })))
  }

  // Remove a connection
  removeConnection(userId: string, response: unknown): void {
    const userConnections = this.connections.get(userId)
    if (userConnections) {
      const index = userConnections.findIndex(conn => conn.response === response)
      if (index > -1) {
        userConnections.splice(index, 1)
        console.log(`SSE connection removed for user ${userId}, remaining: ${userConnections.length}`)

        if (userConnections.length === 0) {
          this.connections.delete(userId)
        }
      }
    }
  }

  // Send event to specific user
  sendToUser(userId: string, event: string, data: unknown): void {
    const userConnections = this.connections.get(userId)
    console.log(`SSE sendToUser called for user ${userId}, event: ${event}`)
    console.log(`Available connections for user ${userId}:`, userConnections ? userConnections.length : 0)
    console.log(`All current users with connections:`, Array.from(this.connections.keys()))

    if (userConnections) {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      console.log(`Sending SSE event '${event}' to user ${userId} with ${userConnections.length} connections`)
      console.log(`Message content:`, message)

      userConnections.forEach((connection, index) => {
        try {
          (connection.response as any).write(message)
          console.log(`SSE message sent successfully to connection ${index} for user ${userId}`)
        } catch (error) {
          console.error(`Failed to send SSE message to connection ${index}:`, error)
          // Remove failed connection
          this.removeConnection(userId, connection.response)
        }
      })
    } else {
      console.log(`No SSE connections found for user ${userId} when trying to send event '${event}'`)
      console.log('All current connections:', Array.from(this.connections.entries()).map(([uid, conns]) => ({
        userId: uid,
        connectionCount: conns.length
      })))

      // Retry sending the event after a delay (for cases where connection might not be ready yet)
      setTimeout(() => {
        const retryConnections = this.connections.get(userId)
        console.log(`Retry attempt for user ${userId} - connections found:`, retryConnections ? retryConnections.length : 0)

        if (retryConnections && retryConnections.length > 0) {
          console.log(`Retrying SSE event '${event}' to user ${userId} - found ${retryConnections.length} connections`)
          const retryMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

          retryConnections.forEach((connection, index) => {
            try {
              (connection.response as any).write(retryMessage)
              console.log(`SSE retry message sent successfully to connection ${index} for user ${userId}`)
            } catch (error) {
              console.error(`Failed to send SSE retry message to connection ${index}:`, error)
              this.removeConnection(userId, connection.response)
            }
          })
        } else {
          console.log(`Retry still no SSE connections found for user ${userId}`)
        }
      }, 2000) // 2 second retry delay
    }
  }

  // Send heartbeat to all connections
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date()

      this.connections.forEach((userConnections, userId) => {
        userConnections.forEach((connection, index) => {
          const timeSinceHeartbeat = now.getTime() - connection.lastHeartbeat.getTime()

          // Remove stale connections (no heartbeat for 30 seconds)
          if (timeSinceHeartbeat > 30000) {
            console.log(`Removing stale SSE connection for user ${userId}`)
            this.removeConnection(userId, connection.response)
            return
          }

          // Send heartbeat
          try {
            (connection.response as any).write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: now.toISOString() })}\n\n`)
            connection.lastHeartbeat = now
          } catch (error) {
            console.error(`Failed to send heartbeat to connection ${index}:`, error)
            this.removeConnection(userId, connection.response)
          }
        })
      })
    }, 10000) // Send heartbeat every 10 seconds
  }

  // Cleanup on server shutdown
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.connections.forEach((userConnections, userId) => {
      userConnections.forEach((connection) => {
        try {
          (connection.response as any).end()
        } catch (error) {
          console.error(`Error closing SSE connection for user ${userId}:`, error)
        }
      })
    })

    this.connections.clear()
  }
}

// Global SSE manager instance
export const sseManager = new SSEManager()

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  sseManager.shutdown()
  process.exit(0)
})

process.on('SIGINT', () => {
  sseManager.shutdown()
  process.exit(0)
})
