import { z } from 'zod'
import { getStripe, getStripePriceId } from '../../utils/stripe'
import { User } from '../../models/User'

const checkoutSchema = z.object({
  planId: z.enum(['professional', 'enterprise']),
  yearly: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const body = await readBody(event)
  const { planId, yearly } = checkoutSchema.parse(body)

  const stripe = getStripe()
  const config = useRuntimeConfig()

  // Ensure Stripe customer exists
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || user.email,
      metadata: { userId: user._id.toString() }
    })
    customerId = customer.id
    await User.updateOne({ _id: user._id }, { stripeCustomerId: customerId })
  }

  const priceId = getStripePriceId(planId, yearly)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    success_url: `${config.public.siteUrl}/protected/usuarios/payments?success=1`,
    cancel_url: `${config.public.siteUrl}/pricing?canceled=1`,
    subscription_data: {
      metadata: {
        type: 'product_subscription',
        userId: user._id.toString(),
        planId
      }
    },
    metadata: {
      userId: user._id.toString(),
      planId
    }
  })

  return { url: session.url }
})
