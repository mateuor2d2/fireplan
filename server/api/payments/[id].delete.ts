import { Payment } from '../../models/Payment'
import { Planes } from '../../models/Planes'
import { connectDB } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden eliminar pagos' })
  }

  await connectDB()

  const paymentId = getRouterParam(event, 'id')
  if (!paymentId) {
    throw createError({ statusCode: 400, message: 'ID de pago requerido' })
  }

  const payment = await Payment.findById(paymentId)
  if (!payment) {
    throw createError({ statusCode: 404, message: 'Pago no encontrado' })
  }

  const plan = await Planes.findById(payment.planId)
  if (plan && plan.paymentId?.toString() === payment._id.toString()) {
    plan.paymentStatus = 'unpaid'
    plan.paymentId = undefined
    plan.canPrint = false
    plan.paidAt = undefined
    await plan.save()
  }

  await Payment.deleteOne({ _id: paymentId })

  return { success: true, message: 'Pago eliminado correctamente' }
})
