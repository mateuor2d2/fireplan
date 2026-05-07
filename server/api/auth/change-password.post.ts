// server/api/auth/change-password.post.ts
import bcrypt from 'bcryptjs'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await connectDB()
  const { currentPassword, newPassword } = await readBody(event)

  // 1. Get the current user from the auth token
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  // 2. Find the full user document (including password hash)
  const userDoc = await User.findById(user._id).select('+password')

  if (!userDoc) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }

  // 3. Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, userDoc.password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password is incorrect'
    })
  }

  // 4. Update to new password
  userDoc.password = newPassword
  await userDoc.save()

  return { success: true }
})
