import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  // Clear authentication cookies
  deleteCookie(event, 'auth_token', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  })

  deleteCookie(event, 'refresh_token', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  })

  return {
    success: true,
    message: 'Logged out successfully'
  }
})
