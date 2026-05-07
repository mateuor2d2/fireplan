import { z } from 'zod'
import { PresupuestoDefault } from '../../models/PresupuestoDefault'

const updatePresupuestoDefaultSchema = z.object({
  id: z.number(),
  concepto: z.string().min(1, 'El concepto es requerido'),
  tipo: z.string().min(1, 'El tipo es requerido'),
  ud: z.number().min(0, 'Las unidades deben ser mayor o igual a 0'),
  precioud: z.number().min(0, 'El precio por unidad debe ser mayor o igual a 0'),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  orden: z.number().optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Check if user is admin
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado'
      })
    }

    // TODO: Add admin check when user model has isAdmin field
    // if (!user.isAdmin) {
    //   throw createError({
    //     statusCode: 403,
    //     statusMessage: 'Acceso denegado - Solo administradores'
    //   })
    // }

    const body = await readBody(event)

    // Validate input
    const validatedData = updatePresupuestoDefaultSchema.parse(body)

    // Find and update the default
    const updatedDefault = await PresupuestoDefault.findOneAndUpdate(
      { id: validatedData.id },
      {
        ...validatedData,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedDefault) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Concepto no encontrado'
      })
    }

    return {
      success: true,
      data: updatedDefault
    }
  } catch (error) {
    console.error('Error updating presupuesto default:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Datos de entrada inválidos',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno del servidor'
    })
  }
})
