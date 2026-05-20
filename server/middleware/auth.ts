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
    || url.pathname.startsWith('/api/webhooks/fichaje')
    || isInternalRequest
  ) {
    return
  }

  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any
    await connectDB()
    const user = await User.findById(decoded.id)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'User not found' })
    }
    event.context.user = user
    event.context.auth = { userId: user._id.toString(), user }
    if (user.role === 'user' && !user.emailVerified) {
      throw createError({ statusCode: 403, statusMessage: 'Email verification required' })
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
