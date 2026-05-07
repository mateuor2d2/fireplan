/**
 * Test endpoint to verify environment variables are loaded
 * GET /api/test-env
 */
export default defineEventHandler(() => {
  return {
    env: {
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.substring(0, 10) + '...',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
      AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
      NODE_ENV: process.env.NODE_ENV
    },
    workingDir: process.cwd(),
    envLoaded: !!process.env.AWS_ACCESS_KEY_ID
  }
})
