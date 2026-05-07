// Script to fix https:// URLs in database
// Run this to update existing det_graf URLs from https:// to https://

const mongoose = require('mongoose')

// MongoDB connection - adjust as needed
const MONGODB_URI = process.env.ME_CONFIG_MONGODB_URL || 'mongodb://localhost:27017/preveniusdbDev'

mongoose.connect(MONGODB_URI)

// Plan model
const PlanSchema = new mongoose.Schema({}, { strict: false, collection: 'planes' })
const Plan = mongoose.model('planes', PlanSchema)

async function fixHttpsUrls() {
  console.log('🔧 Starting HTTPS URL fix process...')

  try {
    // Find all plans that have det_graf with https:// URLs
    const plans = await Plan.find({
      det_graf: {
        $elemMatch: {
          url: { $regex: /^https:\/\// }
        }
      }
    })

    console.log(`📊 Found ${plans.length} plans with https:// URLs to fix`)

    let totalFixed = 0

    for (const plan of plans) {
      let hasChanges = false

      // Fix each image URL
      const fixedImages = plan.det_graf.map((img) => {
        if (img.url && img.url.startsWith('https://')) {
          hasChanges = true
          totalFixed++
          const fixedUrl = img.url.replace('https://', 'https://')
          console.log(`🔄 Fixing URL: ${img.url.substring(0, 80)}... -> ${fixedUrl.substring(0, 80)}...`)

          return {
            ...img,
            url: fixedUrl
          }
        }
        return img
      })

      // Update plan if changes were made
      if (hasChanges) {
        await Plan.updateOne(
          { _id: plan._id },
          {
            $set: {
              det_graf: fixedImages
            }
          }
        )
        console.log(`✅ Updated plan: ${plan.nom_obra || plan._id}`)
      }
    }

    console.log(`🎉 HTTPS URL fix complete! Fixed ${totalFixed} URLs in ${plans.length} plans.`)
  } catch (error) {
    console.error('❌ Error fixing HTTPS URLs:', error)
  } finally {
    await mongoose.disconnect()
  }
}

// Run the fix
fixHttpsUrls()
