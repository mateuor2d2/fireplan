import { s3Service } from '../services/s3.service'

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message:
          'No autorizado. Debe iniciar sesión para acceder a los archivos.'
      })
    }

    const key = getRouterParam(event, 'key')
    if (!key) {
      throw createError({
        statusCode: 400,
        message: 'Se requiere la clave del archivo.'
      })
    }

    // Generate a signed URL for the file
    // Note: In a production environment, you should verify that the user has permission to access this file
    const url = await s3Service.getSignedUrl(key)

    return {
      success: true,
      data: { url },
      message: 'URL firmada generada exitosamente.'
    }
  } catch (error: any) {
    console.error('Error generating signed URL:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al generar la URL firmada.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
