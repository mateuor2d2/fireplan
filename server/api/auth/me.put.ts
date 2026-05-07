// server/api/auth/me.put.ts
import { User } from '../../models/User'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  // Connect to database
  await connectDB()

  // Get the authenticated user from the request context
  const authUser = event.context.user

  if (!authUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  // Get the request body
  const body = await readBody(event)

  // Fields that are allowed to be updated
  const allowedFields = [
    'name',
    // 'email', // Email changes require separate verification flow
    'matriz_nombre',
    'matriz_cif',
    'matriz_dir',
    'matriz_pob',
    'matriz_cp',
    'matriz_tel',
    'matriz_obs',
    'matriz_contacto',
    'appSettings',
    'userDefaultCapitulos',
    'userDefaultPartidas',
    'userDefaultPresupuesto'
  ]

  // Reject direct email changes
  if (body.email !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email changes are not allowed through this endpoint. Use the email verification flow instead.'
    })
  }

  // Filter the update object to only include allowed fields
  const updateData: Record<string, any> = {}

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  try {
    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      authUser._id,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuario no encontrado'
      })
    }

    // Return the updated user without sensitive data
    const { password, ...userWithoutPassword } = updatedUser.toObject()
    return userWithoutPassword
  } catch (error: any) {
    // Handle duplicate key error (e.g., duplicate email)
    if (error.code === 11000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El correo electrónico ya está en uso'
      })
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e: any) => e.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Error de validación',
        data: { errors }
      })
    }

    // For other errors
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al actualizar el usuario',
      data: error.message
    })
  }
})
