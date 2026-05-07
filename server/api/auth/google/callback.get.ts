import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { User } from '../../../models/User'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)

    if (!query.code) {
      throw createError({
        statusCode: 400,
        message: 'Authorization code is required'
      })
    }

    const oauth2Client = new OAuth2Client(
      config.oauth.google.clientId,
      config.oauth.google.clientSecret,
      `${config.public.siteUrl}/api/auth/google/callback`
    )

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(query.code as string)
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: config.oauth.google.clientId
    })

    const payload = ticket.getPayload()
    if (!payload) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Google token'
      })
    }

    const { email, name, picture, sub: googleId } = payload

    // Check if user exists with this email
    let user = await User.findOne({ email })

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }
    } else {
      // Create new user
      user = new User({
        email,
        name,
        googleId,
        avatar: picture,
        role: 'user'
        // No password needed for OAuth users
      })
      await user.save()
    }

    // Create JWT token
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

    // Redirect to protected page
    return sendRedirect(event, '/protected/logged')
  } catch (error: any) {
    console.error('Google OAuth error:', error)
    return sendRedirect(
      event,
      `/login?error=${encodeURIComponent(
        error.message || 'Authentication failed'
      )}`
    )
  }
})
