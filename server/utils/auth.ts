// server/utils/auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

const JWT_EXPIRES_IN = '7d'

export function getJwtSecret(): string {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Set jwtSecret in runtimeConfig or JWT_SECRET env var.')
  }
  return secret
}

export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret())
}

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

export const comparePasswords = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword)
}
