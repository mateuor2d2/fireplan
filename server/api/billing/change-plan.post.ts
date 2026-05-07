import { z } from 'zod'
import { getStripe, getStripePriceId } from '../../utils/stripe'
import { User } from '../../models/User'

const schema = z.object({
  planId: z.enum(['professional', 'enterprise']),
  yearly: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  if (!user.stripeSubscriptionId) {
    throw createError({ statusCode: 400, statusMessage: 'No active subscription to modify' })
  }

  const body = await readBody(event)
  const { planId, yearly } = schema.parse(body)

  const stripe = getStripe()
  const newPriceId = getStripePriceId(planId, yearly)

  try {
    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      throw createError({ statusCode: 400, statusMessage: 'Subscription is not active' })
    }

    const itemId = subscription.items.data[0]?.id
    if (!itemId) {
      throw createError({ statusCode: 500, statusMessage: 'Subscription has no items' })
    }

    // Update subscription item to new price (Stripe handles proration automatically)
    await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: itemId,
        price: newPriceId,
        quantity: 1
      }],
      proration_behavior: 'create_prorations',
      metadata: {
        type: 'product_subscription',
        userId: user._id.toString(),
        planId
      }
    })

    // Update local user record
    await User.updateOne(
      { _id: user._id },
      { plan: planId }
    )

    return { success: true, plan: planId }
  } catch (err: any) {
    console.error('[ChangePlan] Error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to change plan'
    })
  }
})
