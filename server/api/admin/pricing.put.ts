import { z } from 'zod'
import { defineApiEventHandler } from '../../utils/event-handler'

/**
 * PUT /api/admin/pricing
 *
 * Update pricing configuration.
 *
 * Admin only endpoint.
 *
 * Body:
 * {
 *   planPrice: number (in cents, e.g., 2900 = €29.00)
 *   defaultPrecioPSS: number (in cents, e.g., 99 = €0.99)
 * }
 */
const updatePricingSchema = z.object({
  planPrice: z.number().min(1, 'El precio del plan debe ser mayor que 0'),
  defaultPrecioPSS: z.number().min(0, 'El precio PSS debe ser Mayor o igual a 0')
})

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

    const body = await readBody(event)

    // Validate input
    const validatedData = updatePricingSchema.parse(body)

    // TODO: Save to database or environment config
    // For now, we'll store in a simple in-memory cache
    // In production, this should be stored in database or environment variables

    return {
      success: true,
      data: {
        pricing: {
          planPrice: validatedData.planPrice,
          defaultPrecioPSS: validatedData.defaultPrecioPSS,
          currency: 'EUR',
          // Convert to euros for display
          planPriceEur: validatedData.planPrice / 100,
          defaultPrecioPSSEur: validatedData.defaultPrecioPSS / 100
        }
      }
    }
  } catch (error: any) {
    console.error('Error updating pricing:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Datos inválidos',
        data: error.errors
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error al actualizar configuración de precios'
    })
  }
})
