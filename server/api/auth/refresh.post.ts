import jwt from 'jsonwebtoken'
import { User } from '../../models/User'

export default defineEventHandler(async (event) => {
  try {
    // Get the auth token from cookies
    const token = getCookie(event, 'auth_token')

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'No token provided'
      })
    }

    // Verify the token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '')
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Token has expired, but we can still extract data from it
        decoded = jwt.decode(token)
      } else {
        throw createError({
          statusCode: 401,
          message: 'Invalid token'
        })
      }
    }

    // Check if user exists
    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      throw createError({
        statusCode: 401,
        message: 'Invalid token payload'
      })
    }

    const user = await User.findById(decoded.id)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }

    // Create a new token
    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || '',
      { expiresIn: '7d' }
    )

    // Set cookie with new token
    setCookie(event, 'auth_token', newToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    // Return user data without password
    const userResponse = user.toObject()
    const { password, ...userWithoutPassword } = userResponse

    return {
      user: userWithoutPassword,
      token: newToken
    }
  } catch (error) {
    throw error
  }
})
