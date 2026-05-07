import { z } from 'zod'
import { PresupuestoDefault } from '../../models/PresupuestoDefault'

const createPresupuestoDefaultSchema = z.object({
  id: z.number(),
  concepto: z.string().min(1, 'El concepto es requerido'),
  tipo: z.string().min(1, 'El tipo es requerido'),
  ud: z.number().min(0, 'Las unidades deben ser mayor o igual a 0'),
  precioud: z.number().min(0, 'El precio por unidad debe ser mayor o igual a 0'),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  orden: z.number().optional()
})

export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 [API] POST /api/admin/presupuesto-defaults called')

    // Check if user is admin
    const user = event.context.user
    console.log('🔍 [API] POST User context:', user?._id, user?.email)
    if (!user) {
      console.log('🔍 [API] POST No user found, returning 401')
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado'
      })
    }

    const body = await readBody(event)
    console.log('🔍 [API] POST Request body:', body)

    // Validate input
    const validatedData = createPresupuestoDefaultSchema.parse(body)
    console.log('🔍 [API] POST Validated data:', validatedData)

    // Check if ID already exists
    const existingDefault = await PresupuestoDefault.findOne({ id: validatedData.id })
    console.log('🔍 [API] POST Existing default check:', existingDefault)
    if (existingDefault) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ya existe un concepto con este ID'
      })
    }

    // Create new default
    const newDefault = new PresupuestoDefault({
      ...validatedData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await newDefault.save()
    console.log('🔍 [API] POST Created new default:', newDefault)

    return {
      success: true,
      data: newDefault
    }
  } catch (error) {
    console.error('❌ [API] POST Error creating presupuesto default:', error)

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
