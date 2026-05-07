import mongoose from 'mongoose'
import { User } from '../models/User'
import { Center } from '../models/Center'
import { EmergencyPlan } from '../models/EmergencyPlan'
import { Incident } from '../models/Incident'
import { Subscription } from '../models/Subscription'

let isConnected = false
let connectionAttempts = 0
const MAX_RETRIES = 3

export const db = {
  Users: User,
  Centers: Center,
  EmergencyPlans: EmergencyPlan,
  Incidents: Incident,
  Subscription
}

mongoose.connection.on('connected', () => {
  isConnected = true
  connectionAttempts = 0
  console.log('MongoDB connected successfully')
})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
  isConnected = false
})

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
  isConnected = false
})

export async function connectDB(uri?: string) {
  const config = useRuntimeConfig()
  const mongodbUri = uri || config.mongodbUri || process.env.ME_CONFIG_MONGODB_URL

  if (!mongodbUri) {
    throw new Error('MongoDB URI is not defined')
  }

  if (isConnected) {
    return mongoose.connection
  }

  try {
    connectionAttempts++
    const conn = await mongoose.connect(mongodbUri, {
      authSource: 'admin'
    })
    isConnected = true
    connectionAttempts = 0
    return conn
  } catch (error) {
    console.error('MongoDB connection attempt ' + connectionAttempts + ' failed:', error)
    if (connectionAttempts < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts))
      return connectDB(uri)
    }
    throw error
  }
}

export function getDB() {
  if (!isConnected) {
    throw new Error('Database not connected')
  }
  return db
}
