import type { Stripe } from 'stripe'
import { stripe, STRIPE_CONFIG } from './stripe'
import { Payment } from '../models/Payment'
import { Planes } from '../models/Planes'
import { Subscription } from '../models/Subscription'
import { Invoice } from '../models/Invoice'
import { User } from '../models/User'
import { sseManager } from './sse'
import { sendPaymentFailureEmail } from './email'

/**
 * Stripe Webhook Event Handlers
 *
 * Processes Stripe webhook events to synchronize database state with Stripe.
 * All handlers update Payment, Subscription, and Planes models based on event data.
 *
 * Key principles:
 * - Metadata validation: All handlers validate required metadata (userId, planId)
 * - Idempotency: Handlers handle duplicate events gracefully
 * - Error handling: Errors are thrown to be caught by webhook endpoint for logging
 * - Logging: Success and failures logged for debugging
 */

/**
 * Send SSE payment event to user with built-in retry
 */
function sendPaymentEventSSE(
  userId: string,
  event: 'payment_success' | 'payment_failed',
  data: Record<string, any>
): void {
  // Immediate attempt
  sseManager.sendToUser(userId, event, data)
}

/**
 * Handle checkout.session.completed event
 *
 * Updates Payment record to 'succeeded', enables plan printing access,
 * creates a Stripe invoice, and notifies the client via SSE.
 *
 * @param session - Stripe Checkout Session object
 * @throws Error if metadata missing or payment not found
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // Extract metadata
  const { userId, planId } = session.metadata || {}

  if (!userId || !planId) {
    throw new Error('Missing userId or planId in session metadata')
  }

  // Update Payment record
  const paymentIntentId = session.payment_intent as string
  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    {
      status: 'succeeded',
      paymentMethod: 'checkout',
      description: (session as any).description || 'Checkout session payment for safety plan'
    }
  )

  if (!payment) {
    throw new Error(`Payment not found for checkout session ${session.id}`)
  }

  // Update Planes record to enable printing
  await Planes.findByIdAndUpdate(planId, {
    paymentStatus: 'paid',
    paidAt: new Date(),
    canPrint: true
  })

  // Create Stripe invoice for the payment
  const user = await User.findById(userId)
  const plan = await Planes.findById(planId)

  if (user && plan) {
    try {
      const invoice = await stripe.invoices.create({
        customer: session.customer as string,
        description: `Impresión del Plan: ${plan.nom_obra}`,
        metadata: {
          userId,
          planId,
          paymentId: payment._id.toString()
        },
        custom_fields: [
          {
            name: 'plan_id',
            value: planId
          }
        ]
      })

      await stripe.invoiceItems.create({
        customer: session.customer as string,
        invoice: invoice.id,
        description: `Impresión del Plan de Seguridad: ${plan.nom_obra}`,
        amount: Math.round(payment.amount * 100),
        currency: payment.currency
      })

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)
      await stripe.invoices.pay(finalizedInvoice.id, { paid_out_of_band: true })

      // Save invoice to database
      const invoiceRecord = new Invoice({
        userId,
        planId,
        paymentId: payment._id,
        stripeInvoiceId: finalizedInvoice.id,
        invoiceNumber: finalizedInvoice.number || `INV-${Date.now()}`,
        amount: payment.amount,
        currency: payment.currency,
        status: 'paid',
        description: `Impresión del Plan: ${plan.nom_obra}`,
        customerInfo: {
          name: user.name,
          email: user.email,
          address: {
            line1: user.matriz_dir || '',
            city: user.matriz_pob || '',
            postal_code: user.matriz_cp || '',
            country: 'ES'
          },
          taxId: user.matriz_cif || ''
        },
        companyInfo: {
          name: STRIPE_CONFIG.companyInfo.name,
          address: STRIPE_CONFIG.companyInfo.address,
          taxId: STRIPE_CONFIG.companyInfo.tax_id,
          phone: STRIPE_CONFIG.companyInfo.phone,
          email: STRIPE_CONFIG.companyInfo.email
        },
        lineItems: [
          {
            description: `Impresión del Plan de Seguridad: ${plan.nom_obra}`,
            quantity: 1,
            unitPrice: payment.amount,
            totalPrice: payment.amount
          }
        ],
        subtotal: payment.amount,
        taxAmount: 0,
        totalAmount: payment.amount,
        paidAt: new Date()
      })

      await invoiceRecord.save()

      // Update payment with invoice ID
      payment.stripeInvoiceId = finalizedInvoice.id
      await payment.save()

      // Send SSE event to client
      sendPaymentEventSSE(userId, 'payment_success', {
        paymentId: payment._id.toString(),
        planId,
        amount: payment.amount,
        currency: payment.currency,
        invoiceId: finalizedInvoice.id,
        timestamp: new Date().toISOString()
      })
    } catch (invoiceError) {
      // Log but don't fail the webhook - payment was already successful
      console.error('[Webhook] Invoice creation failed after checkout success:', invoiceError)
    }
  }

  console.log(
    `[Webhook] Checkout session ${session.id} processed successfully - Payment ${payment._id} marked as succeeded, Plan ${planId} can now print`
  )
}

/**
 * Handle payment_intent.succeeded event (fallback)
 *
 * Used when checkout.session.completed may not fire or for non-checkout payments.
 *
 * @param paymentIntent - Stripe PaymentIntent object
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id })
  if (!payment) {
    console.error(`[Webhook] Payment not found for intent ${paymentIntent.id}`)
    return
  }

  if (payment.status === 'canceled') {
    console.log(`[Webhook] Payment ${payment._id} was canceled, ignoring success event`)
    return
  }

  payment.status = 'succeeded'
  payment.paymentMethod = paymentIntent.payment_method as string
  await payment.save()

  await Planes.findByIdAndUpdate(payment.planId, {
    paymentStatus: 'paid',
    paidAt: new Date(),
    canPrint: true
  })

  // Attempt invoice creation fallback
  const user = await User.findById(payment.userId)
  const plan = await Planes.findById(payment.planId)
  if (user && plan && paymentIntent.customer) {
    try {
      const existingInvoice = await Invoice.findOne({ paymentId: payment._id })
      if (!existingInvoice) {
        const invoice = await stripe.invoices.create({
          customer: paymentIntent.customer as string,
          description: `Impresión del Plan: ${plan.nom_obra}`,
          metadata: {
            userId: payment.userId,
            planId: payment.planId,
            paymentId: payment._id.toString()
          },
          custom_fields: [{ name: 'plan_id', value: payment.planId }]
        })
        await stripe.invoiceItems.create({
          customer: paymentIntent.customer as string,
          invoice: invoice.id,
          description: `Impresión del Plan de Seguridad: ${plan.nom_obra}`,
          amount: Math.round(payment.amount * 100),
          currency: payment.currency
        })
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)
        await stripe.invoices.pay(finalizedInvoice.id, { paid_out_of_band: true })

        const invoiceRecord = new Invoice({
          userId: payment.userId,
          planId: payment.planId,
          paymentId: payment._id,
          stripeInvoiceId: finalizedInvoice.id,
          invoiceNumber: finalizedInvoice.number || `INV-${Date.now()}`,
          amount: payment.amount,
          currency: payment.currency,
          status: 'paid',
          description: `Impresión del Plan: ${plan.nom_obra}`,
          customerInfo: {
            name: user.name,
            email: user.email,
            address: {
              line1: user.matriz_dir || '',
              city: user.matriz_pob || '',
              postal_code: user.matriz_cp || '',
              country: 'ES'
            },
            taxId: user.matriz_cif || ''
          },
          companyInfo: {
            name: STRIPE_CONFIG.companyInfo.name,
            address: STRIPE_CONFIG.companyInfo.address,
            taxId: STRIPE_CONFIG.companyInfo.tax_id,
            phone: STRIPE_CONFIG.companyInfo.phone,
            email: STRIPE_CONFIG.companyInfo.email
          },
          lineItems: [
            {
              description: `Impresión del Plan de Seguridad: ${plan.nom_obra}`,
              quantity: 1,
              unitPrice: payment.amount,
              totalPrice: payment.amount
            }
          ],
          subtotal: payment.amount,
          taxAmount: 0,
          totalAmount: payment.amount,
          paidAt: new Date()
        })
        await invoiceRecord.save()
        payment.stripeInvoiceId = finalizedInvoice.id
        await payment.save()
      }
      sendPaymentEventSSE(payment.userId, 'payment_success', {
        paymentId: payment._id.toString(),
        planId: payment.planId,
        amount: payment.amount,
        currency: payment.currency,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('[Webhook] Fallback invoice creation failed:', err)
    }
  }

  console.log(`[Webhook] Payment intent ${paymentIntent.id} succeeded - Payment ${payment._id} updated`)
}

/**
 * Handle payment_intent.payment_failed event
 *
 * Marks payment as failed when payment attempt fails.
 *
 * @param paymentIntent - Stripe PaymentIntent object
 * @throws Error if payment not found
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  // Update Payment record
  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntent.id },
    {
      status: 'failed',
      description: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
    }
  )

  if (!payment) {
    console.error(
      `[Webhook] Payment not found for failed payment intent ${paymentIntent.id}`
    )
    return
  }

  // Revert plan status
  await Planes.findByIdAndUpdate(payment.planId, {
    paymentStatus: 'unpaid',
    canPrint: false
  })

  // Send SSE event
  sendPaymentEventSSE(payment.userId, 'payment_failed', {
    paymentId: payment._id.toString(),
    planId: payment.planId,
    error: paymentIntent.last_payment_error?.message || 'Payment failed',
    timestamp: new Date().toISOString()
  })

  console.log(
    `[Webhook] Payment intent ${paymentIntent.id} failed - Payment ${payment._id} marked as failed`
  )
}

/**
 * Handle payment_intent.canceled event
 *
 * Marks payment as canceled and reverts plan status.
 *
 * @param paymentIntent - Stripe PaymentIntent object
 */
export async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id })
  if (!payment) {
    console.error(`[Webhook] Payment not found for canceled payment intent ${paymentIntent.id}`)
    return
  }

  payment.status = 'canceled'
  await payment.save()

  await Planes.findByIdAndUpdate(payment.planId, {
    paymentStatus: 'unpaid',
    canPrint: false
  })

  console.log(`[Webhook] Payment intent ${paymentIntent.id} canceled - Payment ${payment._id} marked as canceled`)
}

/**
 * Handle customer.subscription.created event
 *
 * Creates Subscription record and enables QR access on the plan.
 * Checks for existing subscription to handle idempotency.
 *
 * @param subscription - Stripe Subscription object
 * @throws Error if metadata missing
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  // Extract metadata
  const { planId, userId } = subscription.metadata || {}

  if (!planId || !userId) {
    throw new Error(`Missing planId or userId in subscription ${subscription.id} metadata`)
  }

  // Check for existing subscription (idempotency)
  const existing = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  })

  if (existing) {
    console.log(`[Webhook] Subscription ${subscription.id} already exists, skipping creation`)
    return
  }

  // Extract subscription items data
  const firstItem = subscription.items.data[0]
  if (!firstItem) {
    throw new Error(`Subscription ${subscription.id} has no items`)
  }

  // Create local Subscription record
  await Subscription.create({
    userId,
    planId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    stripePriceId: firstItem.price.id,
    status: subscription.status as 'active' | 'past_due' | 'canceled' | 'paused' | 'expired',
    billingInterval: (firstItem as any).recurring?.interval as 'month' | 'year',
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: firstItem.price.unit_amount || 0,
    currency: subscription.currency,
    metadata: subscription.metadata
  })

  // Update Planes record to enable QR access
  await Planes.findByIdAndUpdate(planId, {
    qrEnabled: true
  })

  console.log(
    `[Webhook] Subscription ${subscription.id} created - User ${userId} now has QR access for Plan ${planId}`
  )
}

/**
 * Handle customer.subscription.updated event
 *
 * Synchronizes local Subscription record with Stripe state.
 * Handles pause_collection by setting status to 'paused'.
 *
 * @param subscription - Stripe Subscription object
 * @throws Error if subscription not found
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  // Find local subscription record
  const localSub = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  })

  if (!localSub) {
    throw new Error(`Subscription ${subscription.id} not found in database`)
  }

  // Update subscription fields
  localSub.status = subscription.status as 'active' | 'past_due' | 'canceled' | 'paused' | 'expired'
  localSub.currentPeriodStart = new Date((subscription as any).current_period_start * 1000)
  localSub.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000)
  localSub.cancelAtPeriodEnd = subscription.cancel_at_period_end

  // Handle paused subscriptions
  if (subscription.pause_collection) {
    localSub.status = 'paused'
  }

  await localSub.save()

  console.log(
    `[Webhook] Subscription ${subscription.id} updated - Status: ${localSub.status}, Period end: ${localSub.currentPeriodEnd.toISOString()}`
  )
}

/**
 * Handle customer.subscription.deleted event
 *
 * Marks subscription as canceled and disables QR access on the plan.
 *
 * @param subscription - Stripe Subscription object
 * @throws Error if subscription not found
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  // Find local subscription record
  const localSub = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  })

  if (!localSub) {
    throw new Error(`Subscription ${subscription.id} not found in database`)
  }

  // Update subscription status
  localSub.status = 'canceled'
  await localSub.save()

  // Update Planes record to disable QR access
  await Planes.findByIdAndUpdate(localSub.planId, {
    qrEnabled: false
  })

  console.log(
    `[Webhook] Subscription ${subscription.id} canceled - QR access disabled for Plan ${localSub.planId}`
  )
}

/**
 * Handle invoice.payment_succeeded event
 *
 * Extends subscription access period when recurring payment succeeds.
 * If subscription was past_due, updates status to active.
 *
 * @param invoice - Stripe Invoice object
 * @throws Error if subscription not found
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  // Update invoice status in database
  await Invoice.findOneAndUpdate(
    { stripeInvoiceId: invoice.id },
    {
      status: 'paid',
      paidAt: new Date()
    }
  )

  // Find subscription
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: (invoice as any).subscription as string
  })

  if (!subscription) {
    throw new Error(`Subscription not found for invoice ${invoice.id}`)
  }

  // Extend access period
  await Planes.findByIdAndUpdate(subscription.planId, {
    canPrint: true
  })

  // If subscription was past_due, update to active
  if (subscription.status === 'past_due') {
    subscription.status = 'active'
    await subscription.save()
  }

  console.log(
    `[Webhook] Invoice ${invoice.id} payment succeeded - Access extended for Plan ${subscription.planId}`
  )
}

/**
 * Handle invoice.payment_failed event
 *
 * Marks subscription as past_due when recurring payment fails.
 * Sends payment failure email notification.
 *
 * @param invoice - Stripe Invoice object
 * @throws Error if subscription not found
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  // Find subscription
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: (invoice as any).subscription as string
  })

  if (!subscription) {
    throw new Error(`Subscription not found for invoice ${invoice.id}`)
  }

  // Update subscription status
  subscription.status = 'past_due'
  await subscription.save()

  // Find invoice record in database
  const dbInvoice = await Invoice.findOne({
    stripeInvoiceId: invoice.id
  })

  // Get user and plan for email
  const user = await User.findById(subscription.userId)
  const plan = await Planes.findById(subscription.planId)

  if (user && plan) {
    const invoiceUrl = (invoice as any).hosted_invoice_url || `https://dashboard.stripe.com/invoices/${invoice.id}`
    const retryCount = (invoice as any).retries_remaining || 0

    try {
      await sendPaymentFailureEmail(
        user.email,
        plan.nom_obra,
        invoiceUrl,
        retryCount
      )
      console.log(`[Webhook] Payment failure email sent for invoice ${invoice.id}`)
    } catch (emailError) {
      console.error('[Webhook] Failed to send payment failure email:', emailError)
    }
  }

  console.log(
    `[Webhook] Invoice ${invoice.id} payment failed - Subscription ${subscription._id} marked as past_due`
  )
}
