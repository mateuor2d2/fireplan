import { S3Client } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

/**
 * Get or create the S3 client singleton
 * Uses environment variables for configuration:
 * - AWS_REGION: S3 region (default: 'eu-west-1')
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    // Force load .env file if not already loaded, with override to ensure our values take precedence
    try {
      require('dotenv').config({
        path: require('path').resolve(process.cwd(), '.env'),
        override: true
      })
    } catch (e) {
      // .env file not found or already loaded
    }

    const region = process.env.AWS_REGION || 'eu-west-1'
    const bucketName = process.env.AWS_BUCKET_NAME!

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      },
      endpoint: `https://s3-${region}.amazonaws.com`,
      forcePathStyle: true // Use path-style access for compatibility
    })
  }
  return s3Client
}
