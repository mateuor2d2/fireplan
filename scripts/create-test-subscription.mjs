// Script to create a test subscription for QR issue reporting
// Run with: node scripts/create-test-subscription.mjs

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db'
const PLAN_ID = '699fe8053bc98885ae2741fa' // The plan ID from your error

async function createTestSubscription() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const Subscription = mongoose.model('Subscription', new mongoose.Schema({
      userId: String,
      planId: String,
      stripeSubscriptionId: String,
      stripeCustomerId: String,
      stripePriceId: String,
      status: String,
      billingInterval: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      createdAt: Date,
      updatedAt: Date
    }))

    // Check if subscription already exists
    const existing = await Subscription.findOne({ planId: PLAN_ID })
    if (existing) {
      console.log('Subscription exists, updating to active...')
      existing.status = 'active'
      existing.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      await existing.save()
      console.log('✅ Subscription updated')
    } else {
      console.log('Creating new test subscription...')
      await Subscription.create({
        userId: 'test-user',
        planId: PLAN_ID,
        stripeSubscriptionId: 'sub_test_' + Date.now(),
        stripeCustomerId: 'cus_test',
        stripePriceId: 'price_test',
        status: 'active',
        billingInterval: 'month',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ Test subscription created')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createTestSubscription()
