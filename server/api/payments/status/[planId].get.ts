import { z } from 'zod'
import { Payment } from '../../../models/Payment'
import { Planes } from '../../../models/Planes'

/**
 * GET /api/payments/status/[planId]
 *
 * Returns payment status for a plan belonging to the authenticated user.
 *
 * Route Params:
 * - planId: string - The plan ID to check payment for
 *
 * Response:
 * {
 *   hasPayment: boolean
 *   status: 'none' | 'pending' | 'succeeded' | 'failed' | 'canceled' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing'
 *   paymentId?: string
 *   amount?: number
 *   currency?: string
 *   createdAt?: string
 * }
 *
 * Error Responses:
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (plan doesn't belong to user)
 * - 404: Not found (plan doesn't exist)
 * - 500: Server error
 */

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from middleware
    const authenticatedUser = event.context.user
    if (!authenticatedUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado: Inicia sesión para continuar'
      })
    }

    const userId = authenticatedUser._id.toString()

    // Get planId from route params
    const planId = getRouterParam(event, 'planId')
    if (!planId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El ID del plan es requerido'
      })
    }

    // Validate planId format (basic MongoDB ObjectId validation)
    const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de plan inválido')
    try {
      ObjectIdSchema.parse(planId)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El ID del plan no tiene un formato válido'
      })
    }

    // Verify plan exists and user has access
    const plan = await Planes.findOne({ _id: planId, createdBy: userId })
    if (!plan) {
      throw createError({
        statusCode: 403,
        statusMessage: 'No tienes acceso a este plan'
      })
    }

    // Find payment for this plan (prefer succeeded, fallback to latest)
    const payment = await Payment.findOne({
      userId: userId,
      planId: planId
    }).sort({ createdAt: -1 })

    if (!payment) {
      // No payment found
      return {
        hasPayment: false,
        status: 'none'
      }
    }

    // Return payment status
    return {
      hasPayment: payment.status === 'succeeded',
      status: payment.status,
      paymentId: payment._id.toString(),
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt.toISOString()
    }
  } catch (error: any) {
    // If it's already a created error, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Log unexpected errors
    console.error('Error fetching payment status:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Error al obtener el estado del pago'
    })
  }
})
