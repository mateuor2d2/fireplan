// server/api/auth/forgot-password.post.ts
import { v4 as uuidv4 } from 'uuid'
import { User } from '../../models/User'
import { PasswordResetToken } from '../../models/PasswordResetToken'
import { connectDB } from '../../utils/db'
import { sendResetEmail } from '../../utils/email'
import { createRateLimitMiddleware } from '../../utils/rateLimit'

const rateLimitForgotPassword = createRateLimitMiddleware(5, 60 * 60 * 1000) // 5 requests per hour

export default defineEventHandler(async (event) => {
  await rateLimitForgotPassword(event)
  await connectDB()
  const { email } = await readBody(event)

  // 1. Find user by email
  const user = await User.findOne({ email })
  if (!user) {
    // Don't reveal if user doesn't exist for security
    return { success: true }
  }

  // 2. Create reset token
  const token = uuidv4()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiration

  await PasswordResetToken.create({
    userId: user._id,
    token,
    expiresAt
  })

  // 3. Send email
  const resetLink = `${process.env.NUXT_PUBLIC_SITE_URL}/reset-password?token=${token}`
  await sendResetEmail(user.email, resetLink)

  return { success: true }
})
