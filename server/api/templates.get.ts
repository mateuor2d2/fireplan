// server/api/templates.get.ts
import { PrintingTemplate } from '../models/PrintingTemplate'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId as string

    // Get global templates (available to all users)
    const globalTemplates = await PrintingTemplate.find({ isGlobal: true })
      .select('name description value content isDefault isGlobal')
      .sort({ name: 1 })

    let userTemplates: any[] = []

    // Get user-specific templates if userId is provided
    if (userId) {
      userTemplates = await PrintingTemplate.find({
        createdBy: userId,
        isGlobal: false
      })
        .select('name description value content isDefault isGlobal createdBy')
        .sort({ name: 1 })
    }

    // Combine templates with global templates first
    const allTemplates = [
      ...globalTemplates.map(template => ({
        _id: template._id,
        name: template.name,
        description: template.description,
        value: template.value,
        content: template.content,
        isDefault: template.isDefault,
        isGlobal: template.isGlobal,
        label: template.name // For UI compatibility
      })),
      ...userTemplates.map(template => ({
        _id: template._id,
        name: template.name,
        description: template.description,
        value: template.value,
        content: template.content,
        isDefault: template.isDefault,
        isGlobal: template.isGlobal,
        createdBy: template.createdBy,
        label: `${template.name} (Personal)` // For UI compatibility
      }))
    ]

    return {
      success: true,
      data: allTemplates,
      count: allTemplates.length
    }
  } catch (error: any) {
    console.error('Error fetching printing templates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching printing templates: ' + error.message
    })
  }
})
