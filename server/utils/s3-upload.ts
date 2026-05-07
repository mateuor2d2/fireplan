import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Client } from './s3-client'
import { v4 as uuidv4 } from 'uuid'

interface UploadParams {
  key: string
  body: Buffer | Uint8Array | ArrayBuffer | string
  contentType: string
  metadata?: Record<string, string>
}

interface ListFileResult {
  key: string
  url: string
  size: number
  lastModified: Date
  contentType: string
  metadata: Record<string, string>
}

/**
 * Upload a file to S3
 */
export async function uploadToS3({
  key,
  body,
  contentType,
  metadata = {}
}: UploadParams): Promise<string> {
  const client = getS3Client()

  // Ensure we have a Buffer for AWS SDK
  let buffer: Buffer
  if (Buffer.isBuffer(body)) {
    buffer = body
  } else if (body instanceof Uint8Array) {
    buffer = Buffer.from(body)
  } else if (body instanceof ArrayBuffer) {
    buffer = Buffer.from(body)
  } else if (typeof body === 'string') {
    buffer = Buffer.from(body)
  } else {
    throw new Error('Unsupported body type for S3 upload')
  }

  await client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata
  }))

  return key
}

/**
 * Upload a file to S3 with auto-generated key
 */
export async function uploadFileToS3({
  file,
  fileName,
  contentType,
  folder = 'uploads',
  metadata = {}
}: {
  file: Buffer | Uint8Array | ArrayBuffer
  fileName: string
  contentType: string
  folder?: string
  metadata?: Record<string, string>
}): Promise<{ key: string, url: string }> {
  const key = `${folder}/${uuidv4()}-${fileName}`

  await uploadToS3({ key, body: file, contentType, metadata })

  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com/${key}`

  return { key, url }
}

/**
 * Get a signed download URL for a file (expires after specified time)
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client()

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key
    }),
    { expiresIn }
  )
}

/**
 * Get the public URL for a file (non-expiring)
 */
export function getPublicUrl(key: string): string {
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-1'}.amazonaws.com/${key}`
}

/**
 * Download a file from S3 (returns Buffer)
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const client = getS3Client()

  const response = await client.send(new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key
  }))

  if (!response.Body) {
    throw new Error('Empty response body from S3')
  }

  // Convert stream to Buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as any) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  const client = getS3Client()

  await client.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key
  }))

  return true
}

/**
 * List all files in a folder
 */
export async function listS3Files(folder: string): Promise<ListFileResult[]> {
  const client = getS3Client()

  const response = await client.send(new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Prefix: folder
  }))

  if (!response.Contents || response.Contents.length === 0) {
    return []
  }

  const files = await Promise.all(
    response.Contents.map(async (item) => {
      if (!item.Key) {
        return null
      }

      try {
        // Get metadata for each file
        const headResponse = await client.send(new HeadObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: item.Key
        }))

        // Generate signed URL for secure access (expires in 24 hours)
        const signedUrl = await getSignedDownloadUrl(item.Key, 86400)

        return {
          key: item.Key,
          url: signedUrl,
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          contentType: headResponse.ContentType || 'application/octet-stream',
          metadata: headResponse.Metadata || {}
        }
      } catch (error) {
        console.warn(`[S3] Failed to get metadata/signed URL for ${item.Key}:`, error)
        // Return basic info even if metadata fails - use public URL as fallback
        return {
          key: item.Key,
          url: getPublicUrl(item.Key),
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          contentType: 'application/octet-stream',
          metadata: {}
        }
      }
    })
  )

  return files.filter(Boolean) as ListFileResult[]
}
