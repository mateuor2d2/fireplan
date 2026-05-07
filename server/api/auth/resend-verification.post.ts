import { v4 as uuidv4 } from 'uuid'
import { EmailVerificationToken } from '../../models/EmailVerificationToken'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'
import { sendVerificationEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  await connectDB()

  const { email } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    return { success: true }
  }

  if (user.emailVerified) {
    return { success: true, message: 'Email already verified' }
  }

  await EmailVerificationToken.deleteMany({ userId: user._id })

  const token = uuidv4()
  await EmailVerificationToken.create({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  })

  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const verificationLink = `${siteUrl}/verify-email?token=${token}`
  await sendVerificationEmail(user.email, verificationLink)

  return { success: true }
})
