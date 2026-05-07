import { s3Service } from '../services/s3.service'

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'No autorizado. Debe iniciar sesión para subir archivos.'
      })
    }

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

    // Get additional metadata
    const metadata: Record<string, string> = {}
    data.forEach((item) => {
      if (item.name && item.name !== 'file' && item.data) {
        metadata[item.name] = item.data.toString('utf8')
      }
    })

    console.log('📤 Starting S3 upload for user:', user._id, 'filename:', fileData.filename)

    // Upload the file to S3
    // Convert the file data to Buffer if it's not already
    const buffer = Buffer.isBuffer(fileData.data)
      ? fileData.data
      : Buffer.from(fileData.data)

    console.log('📤 Upload details:', {
      filename: fileData.filename,
      size: buffer.length,
      type: fileData.type,
      folder: `users/${user._id}`
    })

    const { key, url } = await s3Service.uploadFile({
      file: buffer,
      fileName: fileData.filename,
      contentType: fileData.type || 'application/octet-stream',
      folder: `users/${user._id}`,
      metadata: {
        ...metadata,
        originalName: fileData.filename,
        uploadedBy: user._id.toString(),
        uploadedAt: new Date().toISOString()
      }
    })

    return {
      success: true,
      data: {
        key,
        url,
        originalName: fileData.filename,
        size: fileData.data.length,
        mimeType: fileData.type
      },
      message: 'Archivo subido exitosamente.'
    }
  } catch (error: any) {
    console.error('Error uploading file:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al subir el archivo.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
