import { z } from 'zod'
import { PresupuestoDefault } from '../../models/PresupuestoDefault'

const deletePresupuestoDefaultSchema = z.object({
  id: z.number()
})

export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 [API] DELETE /api/admin/presupuesto-defaults called')

    // Check if user is admin
    const user = event.context.user
    console.log('🔍 [API] DELETE User context:', user?._id, user?.email)
    if (!user) {
      console.log('🔍 [API] DELETE No user found, returning 401')
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado'
      })
    }

    const body = await readBody(event)
    console.log('🔍 [API] DELETE Request body:', body)

    // Validate input
    const { id } = deletePresupuestoDefaultSchema.parse(body)
    console.log('🔍 [API] DELETE Validated ID to delete:', id)

    // Soft delete - mark as inactive instead of removing
    const deletedDefault = await PresupuestoDefault.findOneAndUpdate(
      { id },
      {
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    )

    console.log('🔍 [API] DELETE Deleted default:', deletedDefault)

    if (!deletedDefault) {
      console.log('🔍 [API] DELETE Default not found for ID:', id)
      throw createError({
        statusCode: 404,
        statusMessage: 'Concepto no encontrado'
      })
    }

    return {
      success: true,
      message: 'Concepto eliminado correctamente'
    }
  } catch (error) {
    console.error('❌ [API] DELETE Error:', error)

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
