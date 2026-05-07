// server/api/templates.post.ts
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

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        message: 'El nombre de la plantilla es requerido'
      })
    }

    if (!body.value || !body.value.trim()) {
      throw createError({
        statusCode: 400,
        message: 'El valor de la plantilla es requerido'
      })
    }

    if (!body.content || !body.content.trim()) {
      throw createError({
        statusCode: 400,
        message: 'El contenido de la plantilla es requerido'
      })
    }

    // Sanitize and prepare data
    const templateData = {
      name: body.name.trim(),
      description: body.description?.trim() || body.name.trim(),
      value: body.value.trim().toLowerCase(),
      content: body.content.trim(),
      isDefault: Boolean(body.isDefault),
      isGlobal: Boolean(body.isGlobal),
      createdBy: body.isGlobal ? undefined : user._id
    }

    // Check for duplicate value
    const existingTemplate = await PrintingTemplate.findOne({
      value: templateData.value
    })

    if (existingTemplate) {
      throw createError({
        statusCode: 409,
        message: 'Ya existe una plantilla con este valor'
      })
    }

    // Create new template
    const newTemplate = new PrintingTemplate(templateData)
    const savedTemplate = await newTemplate.save()

    // Populate createdBy for response
    await savedTemplate.populate('createdBy', 'name email')

    return {
      success: true,
      message: 'Plantilla creada exitosamente',
      data: {
        _id: savedTemplate._id,
        name: savedTemplate.name,
        description: savedTemplate.description,
        value: savedTemplate.value,
        content: savedTemplate.content,
        isDefault: savedTemplate.isDefault,
        isGlobal: savedTemplate.isGlobal,
        createdBy: savedTemplate.createdBy,
        createdAt: savedTemplate.createdAt,
        updatedAt: savedTemplate.updatedAt,
        label: savedTemplate.isGlobal ? savedTemplate.name : `${savedTemplate.name} (Personal)`
      }
    }
  } catch (error: any) {
    console.error('Error creating template:', error)

    // Handle duplicate key error
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

    // Re-throw custom errors
    if (error.statusCode) {
      throw error
    }

    // Generic error
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error interno del servidor al crear la plantilla',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
