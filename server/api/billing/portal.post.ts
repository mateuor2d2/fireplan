import { getStripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  if (!user.stripeCustomerId) {
    throw createError({ statusCode: 400, statusMessage: 'No billing account found' })
  }

  const stripe = getStripe()
  const config = useRuntimeConfig()

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${config.public.siteUrl}/protected/usuarios/payments`
  })

  return { url: session.url }
})
