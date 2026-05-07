import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  console.log('Login request received')

  try {
    const body = await readBody(event)
    console.log('Login attempt for email:', body.email)

    // Check if required fields are present
    if (!body.email || !body.password) {
      console.log('Missing required fields')
      throw createError({
        statusCode: 400,
        message: 'Email and password are required'
      })
    }

    // Ensure database connection
    try {
      console.log('Connecting to database...')
      await connectDB()
      console.log('Database connected successfully')
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      throw createError({
        statusCode: 503,
        message: 'Unable to connect to database. Please try again later.'
      })
    }

    try {
      console.log('Searching for user with email:', body.email)
      // Find user by email and explicitly include the password field
      const user = await User.findOne({ email: body.email }).select('+password').lean().exec()

      if (!user) {
        console.log('User not found')
        throw createError({
          statusCode: 401,
          message: 'Invalid credentials'
        })
      }

      if (!user.password) {
        console.log('User found but has no password')
        throw createError({
          statusCode: 401,
          message: 'Invalid credentials'
        })
      }

      console.log('User found, comparing passwords...')

      // Compare passwords directly using bcrypt
      const isMatch = await bcrypt.compare(body.password, user.password)
      console.log('Password match result:', isMatch)

      if (!isMatch) {
        console.log('Password does not match')
        throw createError({
          statusCode: 401,
          message: 'Invalid credentials'
        })
      }

      // Create JWT token
      const config = useRuntimeConfig()
      const token = jwt.sign(
        { id: user._id, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      )

      // Set cookie with token
      setCookie(event, 'auth_token', token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })

      // Return user data without password
      const { password, ...userWithoutPassword } = user

      return {
        user: userWithoutPassword,
        token
      }
    } catch (error: any) {
      console.error('Login error:', error)

      // If it's already a custom error, just rethrow it
      if (error.statusCode) {
        throw error
      }

      // For unhandled errors, return a generic error message
      throw createError({
        statusCode: 500,
        message: 'An error occurred during login. Please try again.'
      })
    }
  } catch (error: any) {
    console.error('Error during login:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'An error occurred during login'
    })
  }
})
