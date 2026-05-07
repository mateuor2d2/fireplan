import jwt from 'jsonwebtoken'
import { Planes } from '../../models/Planes'
import { ObraMember } from '../../models/ObraMember'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await connectDB()

  const { planId, slug, name, password, email } = await readBody(event)

  if (!planId || !slug) {
    throw createError({ statusCode: 400, message: 'planId y slug son requeridos' })
  }

  if (!name || !password || !email) {
    throw createError({ statusCode: 400, message: 'nombre, email y contraseña son requeridos' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'La contraseña debe tener al menos 8 caracteres' })
  }

  const plan = await Planes.findById(planId)
  if (!plan) {
    throw createError({ statusCode: 404, message: 'Plan no encontrado' })
  }

  if (!plan.qrCode || plan.qrCode.slug !== slug) {
    throw createError({ statusCode: 400, message: 'QR inválido' })
  }

  if (plan.qrCode.expiresAt < new Date()) {
    throw createError({ statusCode: 400, message: 'QR expirado' })
  }

  if (!plan.qrCode.enabled) {
    throw createError({ statusCode: 400, message: 'QR deshabilitado' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    const existingMember = await ObraMember.findOne({
      obraId: plan._id,
      userId: existingUser._id
    })
    if (!existingMember) {
      await ObraMember.create({
        obraId: plan._id,
        userId: existingUser._id,
        invitedBy: plan.createdBy,
        joinedVia: 'qr'
      })
    }

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
    email: normalizedEmail,
    name,
    password,
    role: 'control',
    emailVerified: true
  })

  await ObraMember.create({
    obraId: plan._id,
    userId: newUser._id,
    invitedBy: plan.createdBy,
    joinedVia: 'qr'
  })

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
