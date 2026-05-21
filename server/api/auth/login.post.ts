import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    console.log('=== LOGIN REQUEST ===')
    console.log('URL:', event.node.req.url)
    console.log('Method:', event.node.req.method)
    console.log('Content-Type:', getRequestHeader(event, 'content-type'))
    
    const body = await readBody(event)
    console.log('Body:', JSON.stringify(body))
    
    if (!body.email || !body.password) {
      console.log('ERROR: Missing email or password')
      throw createError({ statusCode: 400, message: 'Email and password are required' })
    }
    
    await connectDB()
    const user = await User.findOne({ email: body.email }).select('+password').lean().exec()
    console.log('User found:', !!user)
    
    if (!user || !user.password) {
      console.log('ERROR: User not found')
      throw createError({ statusCode: 401, message: 'Invalid credentials' })
    }
    
    console.log('Comparing password...')
    const isMatch = await bcrypt.compare(body.password, user.password)
    console.log('Password match:', isMatch)
    
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
    console.log('LOGIN SUCCESS')
    return { user: userWithoutPassword, token, redirect: '/protected/admin' }
  } catch (error: any) {
    console.error('LOGIN ERROR:', error.message || error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'Login error' })
  }
})
