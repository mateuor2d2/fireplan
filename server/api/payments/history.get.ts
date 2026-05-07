import jwt from 'jsonwebtoken'
import { Payment } from '../../models/Payment'
import { Invoice } from '../../models/Invoice'
import { Planes } from '../../models/Planes'
import { stripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  try {
    // Verify authentication through middleware
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const userId = user._id.toString()

    // Get query parameters
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    // Get filter parameters
    const status = query.status as string | undefined
    const startDate = query.startDate as string | undefined
    const endDate = query.endDate as string | undefined

    // Build MongoDB filter object dynamically
    const filter: any = { userId }

    // Add status filter if provided
    if (status) {
      const validStatuses = ['succeeded', 'failed', 'canceled', 'pending', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'processing']
      if (!validStatuses.includes(status)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid status filter'
        })
      }
      filter.status = status
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate)
      }
    }

    // Get payments with plan information
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get plan information for each payment
    const paymentsWithPlans = await Promise.all(
      payments.map(async (payment) => {
        const plan = await Planes.findById(payment.planId).select('nom_obra desc_obra').lean()
        return {
          ...payment,
          plan: plan
            ? {
                id: plan._id,
                nom_obra: plan.nom_obra,
                desc_obra: plan.desc_obra
              }
            : null
        }
      })
    )

    // Get invoices for the user
    const invoices = await Invoice.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get plan information for each invoice with Stripe hosted_invoice_url
    const invoicesWithPlans = await Promise.all(
      invoices.map(async (invoice) => {
        const plan = await Planes.findById(invoice.planId).select('nom_obra desc_obra').lean()

        // Retrieve Stripe invoice for hosted_invoice_url
        let invoiceUrl: string | null = null
        try {
          if (invoice.stripeInvoiceId) {
            const stripeInvoice = await stripe.invoices.retrieve(
              invoice.stripeInvoiceId,
              { expand: ['hosted_invoice_url'] }
            )
            invoiceUrl = stripeInvoice.hosted_invoice_url || null
          }
        } catch (stripeError) {
          console.error('Failed to retrieve Stripe invoice URL:', stripeError)
          // Continue without invoiceUrl - graceful degradation
        }

        return {
          ...invoice,
          plan: plan
            ? {
                id: plan._id,
                nom_obra: plan.nom_obra,
                desc_obra: plan.desc_obra
              }
            : null,
          invoiceUrl
        }
      })
    )

    // Get total counts (exclude filters from total counts)
    const totalPayments = await Payment.countDocuments({ userId })
    const totalInvoices = await Invoice.countDocuments({ userId })

    return {
      success: true,
      data: {
        payments: paymentsWithPlans,
        invoices: invoicesWithPlans,
        filters: { status, startDate, endDate },
        pagination: {
          page,
          limit,
          totalPayments,
          totalInvoices,
          totalPages: Math.ceil(Math.max(totalPayments, totalInvoices) / limit)
        }
      }
    }
  } catch (error: any) {
    console.error('Get payment history error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get payment history'
    })
  }
})
