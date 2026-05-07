import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Invitation } from '../../models/Invitation'
import { ObraMember } from '../../models/ObraMember'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await connectDB()

  const { token, name, password } = await readBody(event)

  if (!token || !name || !password) {
    throw createError({
      statusCode: 400,
      message: 'Token, nombre y contraseña son requeridos'
    })
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'La contraseña debe tener al menos 8 caracteres'
    })
  }

  const invitation = await Invitation.findOne({
    token,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })

  if (!invitation) {
    throw createError({
      statusCode: 400,
      message: 'Invitación inválida o expirada'
    })
  }

  const existingUser = await User.findOne({ email: invitation.email })
  if (existingUser) {
    await ObraMember.create({
      obraId: invitation.obraId,
      userId: existingUser._id,
      invitedBy: invitation.invitedBy,
      joinedVia: 'invite'
    })

    invitation.status = 'accepted'
    await invitation.save()

    const authToken = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET || '',
      { expiresIn: '7d' }
    )

    setCookie(event, 'auth_token', authToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    return { success: true, isNewUser: false }
  }

  const newUser = await User.create({
    email: invitation.email,
    name,
    password,
    role: 'control',
    emailVerified: true
  })

  await ObraMember.create({
    obraId: invitation.obraId,
    userId: newUser._id,
    invitedBy: invitation.invitedBy,
    joinedVia: 'invite'
  })

  invitation.status = 'accepted'
  await invitation.save()

  const authToken = jwt.sign(
    { id: newUser._id, role: newUser.role },
    process.env.JWT_SECRET || '',
    { expiresIn: '7d' }
  )

  setCookie(event, 'auth_token', authToken, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })

  return { success: true, isNewUser: true }
})
