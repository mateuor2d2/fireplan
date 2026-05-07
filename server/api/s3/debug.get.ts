export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()

    // Check S3 configuration without exposing secrets
    const s3Config = {
      region: config.s3.region,
      bucketName: config.s3.bucketName,
      endpoint: config.s3.endpoint,
      hasAccessKey: !!process.env.accessKeyId,
      hasSecretKey: !!process.env.secretAccessKey
    }

    return {
      success: true,
      config: s3Config,
      message: 'S3 configuration checked'
    }
  } catch (error: any) {
    console.error('Error checking S3 config:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Error checking S3 configuration',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
