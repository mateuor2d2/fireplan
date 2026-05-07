const mongoose = require('mongoose')
require('dotenv').config()

async function deletePendingPayment() {
  await mongoose.connect(process.env.ME_CONFIG_MONGODB_URL || 'mongodb://localhost:27017/v9planesdbDev')

  const Payment = require('./server/models/Payment').Payment

  // Find pending payment
  const pendingPayment = await Payment.findOne({
    status: 'pending'
  }).sort({ createdAt: -1 })

  if (!pendingPayment) {
    console.log('No pending payment found')
  } else {
    console.log('Found pending payment:')
    console.log('ID:', pendingPayment._id)
    console.log('Plan:', pendingPayment.planId)
    console.log('Status:', pendingPayment.status)
    console.log('Amount:', pendingPayment.amount)
    console.log('Created:', pendingPayment.createdAt)

    await Payment.findByIdAndDelete(pendingPayment._id)
    console.log('Deleted pending payment:', pendingPayment._id)
  }

  await mongoose.disconnect()
}
deletePendingPayment().catch(console.error)
