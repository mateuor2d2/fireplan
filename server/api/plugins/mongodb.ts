// server/plugins/mongodb.ts
import { connectDB, db } from '../../utils/db'

export default defineNitroPlugin(async () => {
  try {
    // Connect to the database
    await connectDB()

    // Get the database models
    const db = db()

    // Add models to the nitro context
    return {
      provide: {
        db
      }
    }
  } catch (error) {
    console.error('Failed to initialize MongoDB plugin:', error)
    process.exit(1)
  }
})
