import mongoose from 'mongoose'
import User from './server/models/User.ts'

const conn = await mongoose.createConnection(process.env.ME_CONFIG_MONGODB_URL || 'mongodb://localhost:27017/preveniusdbDev').asPromise()
const user = await conn.model('User').findOne({ email: 'mateuomr2d2@gmail.com' })
console.log('User found:', user ? 'YES' : 'NO')
if (user) {
  console.log('User ID:', user._id)
  console.log('Name:', user.name)
  console.log('Email:', user.email)
  console.log('Google ID:', user.googleId)
  console.log('Has Password:', !!user.password)
}
await conn.close()
