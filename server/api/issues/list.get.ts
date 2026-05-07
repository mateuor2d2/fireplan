// ============================================================================
// Filtered Issues List Endpoint
// ============================================================================
// GET /api/issues/list
//
// Returns filtered issues for an obra with multiple criteria
// Supports pagination and multi-criteria filtering
//
// ============================================================================

import { z } from 'zod'
import { useDb } from '../../utils/db'

// Zod schema for filter query params
const FilterSchema = z.object({
  obraId: z.string(),
  status: z.array(z.enum(['open', 'in-progress', 'resolved', 'closed'])).optional(),
  type: z.array(z.enum(['annotation', 'comment', 'accident'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  assignedTo: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
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

    const query = getQuery(event)

    // Validate query parameters
    const validationResult = FilterSchema.safeParse(query)

    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Parámetros de filtro inválidos'
      })
    }

    const { obraId, status, type, priority, assignedTo, page = 1, limit = 50 } = validationResult.data

    // Get database models
    const { Issue } = useDb()

    // Build filter object incrementally
    const filter: any = { obraId }

    if (status && status.length > 0) {
      filter.status = { $in: status }
    }

    if (type && type.length > 0) {
      filter.type = { $in: type }
    }

    if (priority && priority.length > 0) {
      filter.priority = { $in: priority }
    }

    if (assignedTo && assignedTo.length > 0) {
      filter.assignedTo = { $in: assignedTo }
    }

    // Calculate pagination
    const skipCount = (page - 1) * limit

    // Query with filters and sort
    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(limit)
      .lean()

    // Get total count for pagination metadata
    const total = await Issue.countDocuments(filter)

    // Transform to safe format
    const safeIssues = issues.map(issue => ({
      id: issue._id.toString(),
      title: issue.title,
      type: issue.type,
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      photoCount: issue.photos?.length || 0,
      commentCount: issue.comments?.length || 0,
      assignedTo: issue.assignedTo || []
    }))

    return {
      success: true,
      data: safeIssues,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error('Filtered issues list error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Error al cargar incidencias filtradas'
    })
  }
})
