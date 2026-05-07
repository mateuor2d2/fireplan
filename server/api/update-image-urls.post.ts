// API endpoint to update image URLs from old bucket to new bucket
// POST /api/update-image-urls

export default defineEventHandler(async (event) => {
  try {
    const { Planes } = await useDb()

    const OLD_BUCKET = 'preveniusimages'
    const NEW_BUCKET = 'prevenius-public-images'

    // Find all plans that have det_graf
    const query = { det_graf: { $exists: true, $ne: [] } }
    const plans = await Planes.find(query).toArray()

    console.log(`📋 Found ${plans.length} plans with images to update`)

    let updatedCount = 0

    for (const plan of plans) {
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

              console.log(`🔄 Updated: ${item.name} -> ${newUrl}`)
            }
          }
        }
      }

      // Save updated plan
      if (planUpdated) {
        await Planes.updateOne(
          { _id: plan._id },
          { $set: { det_graf: plan.det_graf } }
        )
        updatedCount++
        console.log(`✅ Updated plan ${plan._id}`)
      }
    }

    return {
      success: true,
      message: `Updated ${updatedCount} plans successfully`,
      updatedCount
    }
  } catch (error) {
    console.error('❌ Error updating database:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update image URLs'
    })
  }
})
