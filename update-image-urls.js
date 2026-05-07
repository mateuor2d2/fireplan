// Use your project's existing MongoDB setup
// Save this in your project root and run with: bun run update-image-urls.js

import mongoose from 'mongoose'
import { connectDB, useDb } from './server/utils/db.js'

const OLD_BUCKET = 'preveniusimages'
const NEW_BUCKET = 'prevenius-public-images'

async function updateImageUrls() {
  try {
    console.log('🔗 Connecting to database...')
    await connectDB()
    const db = useDb()

    const planesCollection = db.Planes // Use the Planes model

    // Find all plans that have det_graf
    const query = { det_graf: { $exists: true, $ne: [] } }
    const planes = await planesCollection.find(query).toArray()

    console.log(`📋 Found ${planes.length} plans with images to update`)

    let updatedCount = 0

    for (const plan of planes) {
      let planUpdated = false

      // Update det_graf URLs
      if (plan.det_graf && Array.isArray(plan.det_graf)) {
        for (const item of plan.det_graf) {
          if (item.url && item.url.includes(OLD_BUCKET)) {
            // Extract the key from the old URL
            const oldUrl = item.url
            const keyMatch = oldUrl.match(/\/users\/[^?]+/)

            if (keyMatch) {
              const key = keyMatch[0]
              // Create new public URL
              const newUrl = `https://${NEW_BUCKET}.s3.eu-west-1.amazonaws.com${key}`

              // Update the URL
              item.url = newUrl
              planUpdated = true

              console.log(`🔄 Updated: ${item.name}`)
              console.log(`   New: ${newUrl}`)
            }
          }
        }
      }

      // Save updated plan
      if (planUpdated) {
        await planesCollection.updateOne(
          { _id: plan._id },
          { $set: { det_graf: plan.det_graf } }
        )
        updatedCount++
        console.log(`✅ Updated plan ${plan._id}`)
      }
    }

    console.log(`\n🎉 Update completed!`)
    console.log(`📊 Updated ${updatedCount} plans`)
    console.log(`\n💡 Now refresh your app and the images should load from the new public bucket!`)
  } catch (error) {
    console.error('❌ Error updating database:', error)
  }
}

updateImageUrls()
