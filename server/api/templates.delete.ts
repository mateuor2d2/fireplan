// server/api/templates.delete.ts
import { PrintingTemplate } from '../models/PrintingTemplate'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'No autorizado. Debe iniciar sesión.'
      })
    }

    // Parse request body
    const body = await readBody(event)
    const { id } = body

    // Validate template ID
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'El ID de la plantilla es requerido'
      })
    }

    // Find the template
    const template = await PrintingTemplate.findById(id)
    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Plantilla no encontrada'
      })
    }

    // Check authorization
    // Global templates can only be deleted by admin or their creator
    // User templates can only be deleted by their creator
    if (template.isGlobal) {
      // For global templates, only the creator can delete
      if (template.createdBy?.toString() !== user._id.toString()) {
        throw createError({
          statusCode: 403,
          message: 'No tienes permiso para eliminar plantillas globales'
        })
      }
    } else {
      // User templates can only be deleted by their creator
      if (template.createdBy?.toString() !== user._id.toString()) {
        throw createError({
          statusCode: 403,
          message: 'No tienes permiso para eliminar esta plantilla'
        })
      }
    }

    // Prevent deletion of default templates
    if (template.isDefault) {
      throw createError({
        statusCode: 400,
        message: 'No se puede eliminar una plantilla marcada como predeterminada'
      })
    }

    // Delete the template
    const deletedTemplate = await PrintingTemplate.findByIdAndDelete(id)

    if (!deletedTemplate) {
      throw createError({
        statusCode: 404,
        message: 'Plantilla no encontrada después de eliminar'
      })
    }

    // If this was the last global template, set a new default
    if (template.isGlobal) {
      const globalTemplatesCount = await PrintingTemplate.countDocuments({ isGlobal: true })
      if (globalTemplatesCount > 0) {
        // Set the first remaining global template as default
        const firstGlobalTemplate = await PrintingTemplate.findOne({ isGlobal: true }).sort({ createdAt: 1 })
        if (firstGlobalTemplate) {
          await PrintingTemplate.findByIdAndUpdate(
            firstGlobalTemplate._id,
            { $set: { isDefault: true } }
          )
        }
      }
    }

    return {
      success: true,
      message: 'Plantilla eliminada exitosamente',
      data: {
        _id: deletedTemplate._id,
        name: deletedTemplate.name,
        value: deletedTemplate.value
      }
    }
  } catch (error: any) {
    console.error('Error deleting template:', error)

    // Handle cast error (invalid ID)
    if (error.name === 'CastError') {
      throw createError({
        statusCode: 400,
        message: 'ID de plantilla inválido'
      })
    }

    // Re-throw custom errors
    if (error.statusCode) {
      throw error
    }

    // Generic error
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error interno del servidor al eliminar la plantilla',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
