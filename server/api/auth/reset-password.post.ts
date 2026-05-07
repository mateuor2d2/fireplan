// server/api/auth/reset-password.post.ts
import { User } from '../../models/User'
import { PasswordResetToken } from '../../models/PasswordResetToken'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await connectDB()
  const { token, password } = await readBody(event)

  if (!password || password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters long'
    })
  }

  // 1. Find valid token
  const resetToken = await PasswordResetToken.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  })

  if (!resetToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired token'
    })
  }

  // 2. Update user's password
  const user = await User.findById(resetToken.userId)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  user.password = password
  await user.save()

  // 3. Mark token as used
  resetToken.used = true
  await resetToken.save()

  return { success: true }
})
