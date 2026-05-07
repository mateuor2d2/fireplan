import { s3Service } from './services/s3.service'

/**
 * Test endpoint to verify S3 download permissions
 * GET /api/test-s3-download
 */
export default defineEventHandler(async (event) => {
  try {
    // Test file key from the error
    const testKey = 'users/688dc62f90c8c8db23e898a4/04be0941-8ce7-4c93-b3a9-0fd9a5ad4c35-huecoshorizontales2.png'

    console.log('[S3 Test] Attempting to download file:', testKey)
    console.log('[S3 Test] Bucket:', process.env.AWS_BUCKET_NAME)
    console.log('[S3 Test] Region:', process.env.AWS_REGION || 'eu-west-1')
    console.log('[S3 Test] Access Key:', process.env.AWS_ACCESS_KEY_ID?.substring(0, 10) + '...')

    const buffer = await s3Service.downloadFile(testKey)

    return {
      success: true,
      message: 'S3 download successful',
      bucket: process.env.AWS_BUCKET_NAME,
      key: testKey,
      size: buffer.length,
      contentType: 'image/png',
      preview: buffer.toString('base64').substring(0, 100) + '...'
    }
  } catch (error: any) {
    console.error('[S3 Test] Download failed:', error)

    // Check if it's an AWS SDK error
    if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      return {
        success: false,
        error: 'AccessDenied',
        message: 'IAM permissions missing - user needs s3:GetObject permission',
        details: error.message,
        bucket: process.env.AWS_BUCKET_NAME,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 10) + '...'
      }
    }

    return {
      success: false,
      error: error.name,
      message: error.message,
      details: error.toString()
    }
  }
})
