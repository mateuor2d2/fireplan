import { Invoice } from '../../../models/Invoice'
import { stripe } from '../../../utils/stripe'

/**
 * GET /api/invoices/[id]/download
 * Redirects to Stripe-hosted invoice PDF URL
 *
 * Authorization: Users can only download their own invoices
 */
export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from event context
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Autenticación requerida'
      })
    }

    // Get invoiceId from route params
    const invoiceId = getRouterParam(event, 'id')
    if (!invoiceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de factura requerido'
      })
    }

    // Query invoice from database with ownership check
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      userId: user._id.toString()
    })

    if (!invoice) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Factura no encontrada'
      })
    }

    // Retrieve Stripe invoice with hosted URL
    const stripeInvoice = await stripe.invoices.retrieve(
      invoice.stripeInvoiceId,
      { expand: ['hosted_invoice_url'] }
    )

    // Validate hosted_invoice_url exists
    if (!stripeInvoice.hosted_invoice_url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PDF de factura no disponible'
      })
    }

    // Redirect to Stripe-hosted PDF
    return sendRedirect(event, stripeInvoice.hosted_invoice_url)
  } catch (error: any) {
    console.error('Invoice download error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error al descargar factura'
    })
  }
})
