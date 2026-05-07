import { EmailVerificationToken } from '../../models/EmailVerificationToken'
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await connectDB()

  const { token } = await readBody(event)

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Token is required'
    })
  }

  const verificationToken = await EmailVerificationToken.findOne({
    token,
    expiresAt: { $gt: new Date() }
  })

  if (!verificationToken) {
    throw createError({
      statusCode: 400,
      message: 'Token inválido o expirado. Solicita uno nuevo.'
    })
  }

  const user = await User.findById(verificationToken.userId)
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'Usuario no encontrado'
    })
  }

  user.emailVerified = true
  await user.save()

  await EmailVerificationToken.deleteMany({ userId: user._id })

  return { success: true, message: 'Email verificado correctamente' }
})
