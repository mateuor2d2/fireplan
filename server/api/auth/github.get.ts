import { OAuthApp } from '@octokit/oauth-app'

export default defineEventHandler(async (event) => {
  const config: any = useRuntimeConfig()

  if (!config.oauth.github.clientId || !config.oauth.github.clientSecret) {
    throw createError({
      statusCode: 500,
      message: 'GitHub OAuth credentials not configured properly'
    })
  }

  const app = new OAuthApp({
    clientType: 'oauth-app',
    clientId: config.oauth.github.clientId,
    clientSecret: config.oauth.github.clientSecret
  })

  const { url } = await app.getWebFlowAuthorizationUrl({
    state: 'github-oauth',
    scopes: ['user:email'],
    redirectUrl: `${config.public.siteUrl}/api/auth/github/callback`
  })

  return sendRedirect(event, url)
})
