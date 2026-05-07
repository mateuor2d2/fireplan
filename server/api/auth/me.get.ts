// server/api/auth/me.get.ts
export default defineEventHandler((event) => {
  // The user is attached to the request by the auth middleware
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Return user data without password
  const { password, ...userWithoutPassword } = event.context.user.toObject()
  return userWithoutPassword
})
