import { z } from 'zod'
import { stripe, STRIPE_CONFIG } from '../../utils/stripe'
import { Payment } from '../../models/Payment'
import { Planes } from '../../models/Planes'
import { User } from '../../models/User'
import { getPricingConfig, formatPriceEur } from '../../config/pricing'

/**
 * POST /api/payments/create-checkout
 *
 * Creates a Stripe Checkout session for one-time plan payment.
 *
 * Body:
 * {
 *   planId: string
 *   planName?: string
 *   returnUrl?: string
 * }
 *
 * Response:
 * {
 *   checkoutUrl: string
 *   sessionId: string
 *   paymentId: string
 * }
 */

const CreateCheckoutSchema = z.object({
  planId: z.string().min(1, 'El ID del plan es requerido'),
  planName: z.string().optional(),
  returnUrl: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication through middleware
    const authenticatedUser = event.context.user
    if (!authenticatedUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado: Inicia sesión para continuar'
      })
    }

    const userId = authenticatedUser._id.toString()

    // Parse and validate request body
    const body = await readBody(event)
    const { planId, planName, returnUrl } = CreateCheckoutSchema.parse(body)

    // Verify plan exists and user has access
    // Only plan creator can make payments for the plan
    const plan = await Planes.findOne({ _id: planId, createdBy: userId })
    if (!plan) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Solo el creador del plan puede realizar pagos. Si creaste este plan con otra cuenta, inicia sesión con esa cuenta.'
      })
    }

    // Check for existing succeeded payment (prevent double payment)
    const existingPayment = await Payment.findOne({
      userId,
      planId,
      status: 'succeeded'
    })

    if (existingPayment) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Este plan ya ha sido pagado'
      })
    }

    // Get user information
    const user = await User.findById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuario no encontrado'
      })
    }

    // Get or create Stripe customer
    let stripeCustomerId
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId
        }
      })
      stripeCustomerId = customer.id
    }

    // Get plan name for checkout display
    const displayName = planName || plan.nom_obra || 'Plan de Seguridad'

    // Determine success and cancel URLs
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const successUrl = `${siteUrl}/protected/planes/${planId}/print?payment=success`
    const cancelUrl = returnUrl || `${siteUrl}/protected/planes/${planId}`

    // Get pricing configuration
    const pricingConfig = await getPricingConfig()

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [{
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: `Plan de Seguridad: ${displayName}`,
            description: 'Generación de PDF de Plan de Seguridad',
            metadata: {
              planId,
              planName: displayName
            }
          },
          unit_amount: pricingConfig.planPrice // Use configured price
        },
        quantity: 1
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        planName: displayName
      }
    })

    // Create pending Payment record
    // Note: PaymentIntent ID will be updated by webhook handler
    const payment = await Payment.create({
      userId,
      planId,
      stripePaymentIntentId: checkoutSession.payment_intent as string || 'pending',
      amount: pricingConfig.planPriceEur, // Store in euros
      currency: STRIPE_CONFIG.currency,
      status: 'pending',
      description: `Pago del plan: ${displayName}`,
      metadata: {
        checkoutSessionId: checkoutSession.id,
        planName: displayName,
        stripeCustomerId
      }
    })

    // Update plan status to processing
    await Planes.findByIdAndUpdate(planId, {
      paymentStatus: 'processing',
      paymentId: payment._id
    })

    return {
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      paymentId: payment._id.toString()
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error)

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
      statusMessage: 'Error al crear la sesión de pago'
    })
  }
})
