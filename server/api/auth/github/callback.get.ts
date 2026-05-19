import { OAuthApp } from '@octokit/oauth-app'
import jwt from 'jsonwebtoken'
import { User } from '../../../models/User'

export default defineEventHandler(async (event) => {
  try {
    const config: any = useRuntimeConfig()
    const query = getQuery(event)

    if (query.error) {
      throw createError({
        statusCode: 400,
        message: `GitHub OAuth error: ${
          query.error_description || query.error
        }`
      })
    }

    if (!query.code) {
      throw createError({
        statusCode: 400,
        message: 'Authorization code is required'
      })
    }

    const app = new OAuthApp({
      clientType: 'oauth-app',
      clientId: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret
    })

    // Exchange authorization code for token
    const { authentication } = await app.createToken({
      code: query.code as string
    })
    const token = authentication.token

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'nuxt-oauth-app'
      }
    })

    if (!userResponse.ok) {
      throw createError({
        statusCode: 400,
        message: 'Failed to fetch user from GitHub'
      })
    }

    const githubUser = await userResponse.json()

    // Get user emails from GitHub
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'nuxt-oauth-app'
      }
    })

    const emails = await emailResponse.json()
    const primaryEmail
      = emails.find((email: any) => email.primary)?.email || githubUser.email

    if (!primaryEmail) {
      throw createError({
        statusCode: 400,
        message: 'No email found in GitHub account'
      })
    }

    // Check if user exists with this email
    let user = await User.findOne({ email: primaryEmail })

    if (user) {
      // Update GitHub ID if not set
      if (!user.githubId) {
        user.githubId = githubUser.id.toString()
        await user.save()
      }
    } else {
      // Create new user
      user = new User({
        email: primaryEmail,
        name: githubUser.name || githubUser.login,
        githubId: githubUser.id.toString(),
        avatar: githubUser.avatar_url,
        role: 'user'
        // No password needed for OAuth users
      })
      await user.save()
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    // Set cookie with token
    setCookie(event, 'auth_token', jwtToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    // Redirect to protected page
    return sendRedirect(event, '/protected/logged')
  } catch (error: any) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(
      event,
      `/login?error=${encodeURIComponent(
        error.message || 'Authentication failed'
      )}`
    )
  }
})
