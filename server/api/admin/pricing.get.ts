import { defineApiEventHandler } from '../../utils/event-handler'

/**
 * GET /api/admin/pricing
 *
 * Get current pricing configuration.
 *
 * Admin only endpoint.
 */
export default defineApiEventHandler(async (event) => {
  try {
    // Verify authentication through middleware
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado'
      })
    }

    // Check if user is admin
    // TODO: Add isAdmin field to User model and check it here
    // if (!user.isAdmin) {
    //   throw createError({
    //     statusCode: 403,
    //     statusMessage: 'Acceso denegado - Solo administradores'
    //   })
    // }

    return {
      pricing: {
        // Default price for one-time safety plan payment (in cents)
        planPrice: 2900, // €29.00

        // Default price per unit for user customization (user.precioPSS)
        defaultPrecioPSS: 99, // €0.99 per unit

        // Currency
        currency: 'EUR',

        // Description
        description: 'Precio por defecto para Plan de Seguridad (€29.00) y personalización por unidad (€0.99)'
      }
    }
  } catch (error: any) {
    console.error('Error getting pricing:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener configuración de precios'
    })
  }
})
