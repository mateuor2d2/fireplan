import { OAuth2Client } from 'google-auth-library'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const oauth2Client = new OAuth2Client(
    config.oauth.google.clientId,
    config.oauth.google.clientSecret,
    `${config.public.siteUrl}/api/auth/google/callback`
  )

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
  })

  return sendRedirect(event, authUrl)
})
