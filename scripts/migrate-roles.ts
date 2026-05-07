import { connect } from 'mongoose'

const MONGODB_URI = process.env.ME_CONFIG_MONGODB_URL || 'mongodb://localhost:27017/preveniusdbDev'

async function migrate() {
  console.log('Connecting to MongoDB...')
  const db = await connect(MONGODB_URI)
  console.log('Connected.')

  const users = db.connection.collection('users')

  const result = await users.updateMany(
    { emailVerified: { $exists: false } },
    { $set: { emailVerified: true } }
  )

  console.log(`Migration complete. ${result.modifiedCount} users updated: emailVerified → true`)

  await db.disconnect()
  console.log('Done.')
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
