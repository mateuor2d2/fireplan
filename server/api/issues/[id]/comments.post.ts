// ============================================================================
// Issue Comment Creation Endpoint
// ============================================================================
// POST /api/issues/[id]/comments
//
// Adds a new comment to an issue
// Tracks author information and timestamps
//
// ============================================================================

import { z } from 'zod'
import { useDb } from '../../../utils/db'

// Zod schema for comment creation
const CommentSchema = z.object({
  text: z.string().min(1).max(2000)
})

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Autenticación requerida'
      })
    }

    const issueId = getRouterParam(event, 'id')
    if (!issueId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'ID de incidencia es requerido'
      })
    }

    // Get database models
    const { Issue } = useDb()

    // Read and validate body
    const body = await readBody(event)
    const validationResult = CommentSchema.safeParse(body)

    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'El texto del comentario es requerido (máx 2000 caracteres)'
      })
    }

    const { text } = validationResult.data

    // Find issue
    const issue = await Issue.findById(issueId)

    if (!issue) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Incidencia no encontrada'
      })
    }

    // Create comment object
    const comment = {
      id: Date.now().toString(),
      userId: user._id.toString(),
      userName: user.name || user.email || 'Usuario',
      text,
      createdAt: new Date()
    }

    // Add comment to issue
    if (!issue.comments) {
      issue.comments = []
    }

    issue.comments.push(comment)
    issue.updatedAt = new Date()

    await issue.save()

    return {
      success: true,
      data: comment
    }
  } catch (error: any) {
    console.error('Comment creation error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Error al añadir comentario'
    })
  }
})
