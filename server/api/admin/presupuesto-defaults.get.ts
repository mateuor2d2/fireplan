import { PresupuestoDefault } from '../../models/PresupuestoDefault'

export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 [API] GET /api/admin/presupuesto-defaults called')

    // Check if user is admin
    const user = event.context.user
    console.log('🔍 [API] User context:', user?._id, user?.email)
    if (!user) {
      console.log('🔍 [API] No user found, returning 401')
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado'
      })
    }

    console.log('🔍 [API] Fetching presupuesto defaults from database...')
    const defaults = await PresupuestoDefault.find({}).sort({ orden: 1, id: 1 })
    console.log('🔍 [API] Found', defaults.length, 'presupuesto defaults:', defaults)

    return {
      success: true,
      data: defaults
    }
  } catch (error) {
    console.error('❌ [API] Error loading presupuesto defaults:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno del servidor'
    })
  }
})
