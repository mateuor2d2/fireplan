import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    if (!body.email || !body.password) {
      throw createError({ statusCode: 400, message: 'Email and password are required' })
    }
    await connectDB()
    const user = await User.findOne({ email: body.email }).select('+password').lean().exec()
    if (!user || !user.password) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' })
    }
    const isMatch = await bcrypt.compare(body.password, user.password)
    if (!isMatch) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' })
    }
    const config = useRuntimeConfig()
    const token = jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, { expiresIn: '7d' })
    setCookie(event, 'auth_token', token, {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production', sameSite: 'strict'
    })
    const { password, ...userWithoutPassword } = user
    const redirectUrl = getRedirectUrl(user.role as string)
    return { user: userWithoutPassword, token, redirect: redirectUrl }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'Login error' })
  }
})

function getRedirectUrl(role: string): string {
  switch (role) {
    case 'superadmin': return '/protected/admin'
    case 'tenant': return '/protected/tenant'
    case 'centroadmin': return '/protected/centro'
    case 'user':
    default: return '/protected'
  }
}
