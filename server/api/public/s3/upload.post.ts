import { s3Service } from '../../services/s3.service'
import { createRateLimitMiddleware } from '../../../utils/rateLimit'
import { v4 as uuidv4 } from 'uuid'

// Rate limiting: 20 uploads/hour per IP to prevent abuse
const rateLimitUpload = createRateLimitMiddleware(
  20, // 20 requests
  60 * 60 * 1000 // 1 hour
)

// Allowed MIME types for image uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  try {
    // Apply rate limiting
    await rateLimitUpload(event)

    // This is a public endpoint - no authentication check
    // Public users can upload photos for issue reporting

    // Read the multipart form data
    const data = await readMultipartFormData(event)

    if (!data || !data.length) {
      throw createError({
        statusCode: 400,
        message: 'No se proporcionó ningún archivo.'
      })
    }

    // Find the file in the form data
    const fileData = data.find(item => item.name === 'file')
    if (!fileData || !fileData.filename) {
      throw createError({
        statusCode: 400,
        message: 'No se encontró ningún archivo en la solicitud.'
      })
    }

    // Validate file type (images only)
    if (!fileData.type || !ALLOWED_MIME_TYPES.includes(fileData.type)) {
      throw createError({
        statusCode: 400,
        message: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'
      })
    }

    // Convert the file data to Buffer if it's not already
    const buffer = Buffer.isBuffer(fileData.data)
      ? fileData.data
      : Buffer.from(fileData.data)

    // Validate file size (max 10MB)
    if (buffer.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        message: `El archivo excede el tamaño máximo de 10MB. Tamaño: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`
      })
    }

    // Get additional metadata from form data
    const metadata: Record<string, string> = {}
    let obraId: string | undefined

    data.forEach((item) => {
      if (item.name && item.name !== 'file' && item.data) {
        const value = item.data.toString('utf8')
        metadata[item.name] = value

        // Extract obraId if provided
        if (item.name === 'obraId') {
          obraId = value
        }
      }
    })

    console.log('📤 Starting PUBLIC S3 upload for obra:', obraId || 'unknown', 'filename:', fileData.filename)

    // Generate unique folder for this upload session
    const uploadSessionId = uuidv4()
    const folder = `public-issue-uploads/${uploadSessionId}`

    console.log('📤 Upload details:', {
      filename: fileData.filename,
      size: buffer.length,
      type: fileData.type,
      folder,
      obraId: obraId || 'not provided'
    })

    // Upload the file to S3
    const { key, url } = await s3Service.uploadFile({
      file: buffer,
      fileName: fileData.filename,
      contentType: fileData.type || 'application/octet-stream',
      folder,
      metadata: {
        ...metadata,
        originalName: fileData.filename,
        uploadedBy: 'public-issue-report',
        source: 'qr-form',
        obraId: obraId || 'unknown',
        uploadedAt: new Date().toISOString()
      }
    })

    return {
      success: true,
      data: {
        key,
        url,
        originalName: fileData.filename,
        size: buffer.length,
        mimeType: fileData.type
      },
      message: 'Archivo subido exitosamente.'
    }
  } catch (error: any) {
    console.error('Error uploading file to public endpoint:', error)

    // Handle rate limit errors specifically
    if (error.statusCode === 429) {
      throw error // Re-throw rate limit errors as-is
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al subir el archivo.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
