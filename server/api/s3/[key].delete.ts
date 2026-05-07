import { s3Service } from '../services/s3.service'

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'No autorizado. Debe iniciar sesión para eliminar archivos.'
      })
    }

    const key = getRouterParam(event, 'key')
    if (!key) {
      throw createError({
        statusCode: 400,
        message: 'Se requiere la clave del archivo.'
      })
    }

    // In a real application, you should verify that the user has permission to delete this file
    // For example, you might check if the file belongs to the user or if the user is an admin

    // Delete the file from S3
    await s3Service.deleteFile(key)

    return {
      success: true,
      message: 'Archivo eliminado exitosamente.'
    }
  } catch (error: any) {
    console.error('Error deleting file:', error)

    // Handle file not found error
    if (error.name === 'NoSuchKey' || error.code === 'NotFound') {
      throw createError({
        statusCode: 404,
        message: 'El archivo no existe o ya ha sido eliminado.'
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al eliminar el archivo.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
