// ============================================================================
// Issue Status Update Endpoint
// ============================================================================
// PATCH /api/issues/[id]/status
//
// Updates issue status with workflow validation
// Prevents invalid status transitions
//
// ============================================================================

import { z } from 'zod'
import { useDb } from '../../../utils/db'

// Zod schema for status update
const StatusUpdateSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed'])
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

    // Get database models
    const { Issue } = useDb()

    const issueId = getRouterParam(event, 'id')
    if (!issueId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'ID de incidencia es requerido'
      })
    }

    // Read and validate body
    const body = await readBody(event)
    const validationResult = StatusUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Estado inválido. Debe ser: open, in-progress, resolved, o closed'
      })
    }

    const { status: newStatus } = validationResult.data

    // Find issue
    const issue = await Issue.findById(issueId)

    if (!issue) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Incidencia no encontrada'
      })
    }

    const currentStatus = issue.status

    // Validate status transition (only allow valid workflow)
    const validTransitions: Record<string, string[]> = {
      'open': ['in-progress', 'resolved', 'closed'],
      'in-progress': ['resolved', 'open', 'closed'],
      'resolved': ['closed', 'in-progress', 'open'],
      'closed': ['open', 'in-progress']
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Transición de estado inválida: ${currentStatus} → ${newStatus}`
      })
    }

    // Update issue status
    issue.status = newStatus
    issue.updatedAt = new Date()

    await issue.save()

    return {
      success: true,
      data: {
        id: issue._id.toString(),
        status: issue.status,
        updatedAt: issue.updatedAt
      }
    }
  } catch (error: any) {
    console.error('Status update error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Error al actualizar estado'
    })
  }
})
