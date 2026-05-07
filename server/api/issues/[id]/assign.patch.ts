// ============================================================================
// Issue Assignment Endpoint
// ============================================================================
// PATCH /api/issues/[id]/assign
//
// Assigns coordinators to issues with validation
// Validates that coordinator IDs exist and are active
//
// ============================================================================

import { z } from 'zod'
import { useDb } from '../../../utils/db'

// Zod schema for assignment
const AssignmentSchema = z.object({
  assignedTo: z.array(z.string())
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
    const validationResult = AssignmentSchema.safeParse(body)

    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'assignedTo debe ser un array de IDs de coordinadores'
      })
    }

    const { assignedTo } = validationResult.data

    // Find issue
    const issue = await Issue.findById(issueId)

    if (!issue) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Incidencia no encontrada'
      })
    }

    // Validate all coordinator IDs exist and are active
    if (assignedTo.length > 0) {
      const coordinators = await Coordinator.find({
        _id: { $in: assignedTo },
        active: true
      })

      if (coordinators.length !== assignedTo.length) {
        const foundIds = coordinators.map(c => c._id.toString())
        const invalidIds = assignedTo.filter(id => !foundIds.includes(id))

        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: `Coordinadores inválidos o inactivos: ${invalidIds.join(', ')}`
        })
      }

      // Update issue with populated coordinator details
      issue.assignedTo = assignedTo
      issue.updatedAt = new Date()

      await issue.save()

      // Return with populated coordinator data
      const updatedIssue = await Issue.findById(issueId).lean()

      return {
        success: true,
        data: {
          id: updatedIssue!._id.toString(),
          assignedTo: updatedIssue!.assignedTo || [],
          updatedAt: updatedIssue!.updatedAt,
          coordinators: coordinators.map(c => ({
            id: c._id.toString(),
            name: c.name,
            email: c.email
          }))
        }
      }
    } else {
      // Clear assignment
      issue.assignedTo = []
      issue.updatedAt = new Date()

      await issue.save()

      return {
        success: true,
        data: {
          id: issue._id.toString(),
          assignedTo: [],
          updatedAt: issue.updatedAt,
          coordinators: []
        }
      }
    }
  } catch (error: any) {
    console.error('Assignment error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Error al actualizar asignación'
    })
  }
})
