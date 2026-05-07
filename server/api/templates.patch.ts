// server/api/templates.patch.ts
import { z } from 'zod'
import { PrintingTemplate } from '../models/PrintingTemplate'

// Validation schema for template updates
const updateTemplateSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().max(1000).optional(),
  value: z.string().min(1).max(100).optional(),
  content: z.string().min(10).optional(),
  isDefault: z.boolean().optional(),
  isGlobal: z.boolean().optional()
})

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
    const { id, ...updateData } = body

    // Validate template ID
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'El ID de la plantilla es requerido'
      })
    }

    // Validate update data
    const validationResult = updateTemplateSchema.safeParse(updateData)
    if (!validationResult.success) {
      const messages = validationResult.error.issues.map(issue => issue.message)
      throw createError({
        statusCode: 400,
        message: `Error de validación: ${messages.join(', ')}`
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
    // Global templates can be updated by admin OR the original creator
    // User templates can only be updated by their creator
    const isAdmin = user.role === 'admin'
    const isCreator = template.createdBy?.toString() === user._id.toString()

    if (template.isGlobal) {
      // Global templates: admin can edit any, others can only edit their own
      if (!isAdmin && !isCreator) {
        throw createError({
          statusCode: 403,
          message: 'No tienes permiso para actualizar plantillas globales'
        })
      }
    } else {
      // User templates: only creator can edit
      if (!isCreator) {
        throw createError({
          statusCode: 403,
          message: 'No tienes permiso para actualizar esta plantilla'
        })
      }
    }

    // Check for duplicate value if value is being updated
    if (updateData.value && updateData.value !== template.value) {
      const existingTemplate = await PrintingTemplate.findOne({
        value: updateData.value.trim().toLowerCase(),
        _id: { $ne: id } // Exclude current template
      })

      if (existingTemplate) {
        throw createError({
          statusCode: 409,
          message: 'Ya existe una plantilla con este valor'
        })
      }
    }

    // Prepare update data
    const processedUpdateData: any = {}

    if (updateData.name) processedUpdateData.name = updateData.name.trim()
    if (updateData.description !== undefined) processedUpdateData.description = updateData.description?.trim() || ''
    if (updateData.value) processedUpdateData.value = updateData.value.trim().toLowerCase()
    if (updateData.content) processedUpdateData.content = updateData.content.trim()
    if (updateData.isDefault !== undefined) processedUpdateData.isDefault = updateData.isDefault
    if (updateData.isGlobal !== undefined) processedUpdateData.isGlobal = updateData.isGlobal

    // Set updated timestamp
    processedUpdateData.updatedAt = new Date()

    // If setting as default, unset other defaults
    if (updateData.isDefault === true) {
      await PrintingTemplate.updateMany(
        {
          $or: [
            { isGlobal: true },
            { createdBy: user._id }
          ],
          _id: { $ne: id }
        },
        { $set: { isDefault: false } }
      )
    }

    // Update the template
    const updatedTemplate = await PrintingTemplate.findByIdAndUpdate(
      id,
      { $set: processedUpdateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')

    if (!updatedTemplate) {
      throw createError({
        statusCode: 404,
        message: 'Plantilla no encontrada después de actualizar'
      })
    }

    return {
      success: true,
      message: 'Plantilla actualizada exitosamente',
      data: {
        _id: updatedTemplate._id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        value: updatedTemplate.value,
        content: updatedTemplate.content,
        isDefault: updatedTemplate.isDefault,
        isGlobal: updatedTemplate.isGlobal,
        createdBy: updatedTemplate.createdBy,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt,
        label: updatedTemplate.isGlobal ? updatedTemplate.name : `${updatedTemplate.name} (Personal)`
      }
    }
  } catch (error: any) {
    console.error('Error updating template:', error)

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una plantilla con este valor o nombre',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }

    // Handle validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message)
      throw createError({
        statusCode: 400,
        message: `Error de validación: ${messages.join(', ')}`
      })
    }

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
      message: error.message || 'Error interno del servidor al actualizar la plantilla',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
