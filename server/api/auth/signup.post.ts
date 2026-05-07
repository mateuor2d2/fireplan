import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../../models/User'
import { EmailVerificationToken } from '../../models/EmailVerificationToken'
import { connectDB } from '../../utils/db'
import { rateLimitSignup } from '../../utils/rateLimit'
import { sendVerificationEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  try {
    await rateLimitSignup(event)

    const body = await readBody(event)

    if (!body.email || !body.password || !body.name) {
      throw createError({
        statusCode: 400,
        message: 'Email, password, and name are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid email format'
      })
    }

    try {
      await connectDB()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      throw createError({
        statusCode: 503,
        message: 'Unable to connect to database. Please try again later.'
      })
    }

    try {
      const existingUser = await User.findOne({ email: body.email })
      if (existingUser) {
        throw createError({
          statusCode: 409,
          message: 'Email already in use'
        })
      }

      if (body.password.length < 8) {
        throw createError({
          statusCode: 400,
          message: 'Password must be at least 8 characters long'
        })
      }

      const newUser = await User.create({
        email: body.email,
        password: body.password,
        name: body.name,
        role: 'user', // NEVER allow client to set role
        emailVerified: false,
        client: body.client || null
      })

      const token = uuidv4()
      await EmailVerificationToken.create({
        userId: newUser._id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })

      const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const verificationLink = `${siteUrl}/verify-email?token=${token}`

      try {
        await sendVerificationEmail(newUser.email, verificationLink)
      } catch (emailError: any) {
        console.error('Failed to send verification email:', emailError.message)
      }

      const userResponse = newUser.toObject()
      const { password, ...userWithoutPassword } = userResponse

      return {
        user: userWithoutPassword,
        requiresVerification: true
      }
    } catch (error: any) {
      if (error.code === 11000) {
        throw createError({
          statusCode: 409,
          message: 'Email already in use'
        })
      }

      if (error.name === 'ValidationError') {
        throw createError({
          statusCode: 400,
          message: Object.values(error.errors).map((e: any) => e.message).join(', ')
        })
      }

      console.error('Signup error:', error)
      throw error
    }
  } catch (error: any) {
    console.error('Signup error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred during signup. Please try again.'
    })
  }
})
