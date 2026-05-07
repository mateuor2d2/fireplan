import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { connectDB } from '../utils/db'
import { getJwtSecret } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const isInternalRequest = getRequestHeader(event, 'x-internal-request') === 'true'

  if (
    !url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/api/auth/login')
    || url.pathname.startsWith('/api/auth/signup')
    || url.pathname.startsWith('/api/auth/forgot-password')
    || url.pathname.startsWith('/api/auth/reset-password')
    || url.pathname.startsWith('/api/auth/verify-email')
    || url.pathname.startsWith('/api/auth/resend-verification')
    || url.pathname.startsWith('/api/auth/accept-invite')
    || url.pathname.startsWith('/api/auth/qr-join')
    || url.pathname.startsWith('/api/webhooks/stripe')
    || isInternalRequest
  ) {
    return
  }

  // Require authentication for mastertable routes
  if (url.pathname.startsWith('/api/mastertable')) {
    const token = getCookie(event, 'auth_token')

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required for mastertable operations'
      })
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any

      await connectDB()
      const user = await User.findById(decoded.id)

      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: 'User not found'
        })
      }

      event.context.user = user
      return
    } catch (error) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }
  }

  // For other API routes, check token but don't throw error if not present
  const token = getCookie(event, 'auth_token')

  if (!token) {
    if (
      url.pathname.startsWith('/api/auth/me')
      || url.pathname.startsWith('/api/auth/refresh')
      || url.pathname.startsWith('/api/auth/logout')
      || url.pathname.startsWith('/api/planes')
      || url.pathname.startsWith('/api/conceptos')
      || url.pathname.startsWith('/api/payments')
    ) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    return
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any

    await connectDB()
    const user = await User.findById(decoded.id)

    if (!user) {
      if (
        url.pathname.startsWith('/api/auth/me')
        || url.pathname.startsWith('/api/auth/refresh')
        || url.pathname.startsWith('/api/auth/logout')
      ) {
        throw createError({
          statusCode: 401,
          statusMessage: 'User not found'
        })
      }
      return
    }

    event.context.user = user

    if (user.role === 'user' && !user.emailVerified) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Email verification required'
      })
    }
  } catch (error) {
    if (
      url.pathname.startsWith('/api/auth/me')
      || url.pathname.startsWith('/api/auth/refresh')
      || url.pathname.startsWith('/api/auth/logout')
    ) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }
  }
})
