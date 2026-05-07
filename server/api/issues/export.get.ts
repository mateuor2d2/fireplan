// ============================================================================
// Issues Export Endpoint
// ============================================================================
// GET /api/issues/export
//
// Exports issues to CSV or PDF format
// Supports same filtering as list endpoint
//
// ============================================================================

import { z } from 'zod'
import { useDb } from '../../utils/db'

// Zod schema for export query params
const ExportSchema = z.object({
  obraId: z.string(),
  format: z.enum(['csv', 'pdf']).default('csv'),
  status: z.array(z.enum(['open', 'in-progress', 'resolved', 'closed'])).optional(),
  type: z.array(z.enum(['annotation', 'comment', 'accident'])).optional(),
  priority: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  assignedTo: z.array(z.string()).optional()
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
    const validationResult = ExportSchema.safeParse(query)

    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Parámetros de exportación inválidos'
      })
    }

    const { obraId, format, status, type, priority, assignedTo } = validationResult.data

    // Get database models
    const { Issue, Planes } = useDb()

    // Build filter object (same logic as list endpoint)
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

    // Fetch filtered issues
    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    // Get obra name for filename
    const plan = await Planes.findById(obraId)

    if (!plan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Obra no encontrada'
      })
    }

    const obraName = plan.nom_obra || 'Obra'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Título', 'Tipo', 'Estado', 'Prioridad', 'Creado Por', 'Fecha Creación', 'Actualizado', 'Fotos', 'Comentarios', 'Asignado A']

      const rows = issues.map(issue => [
        issue._id.toString(),
        issue.title,
        issue.type,
        issue.status,
        issue.priority,
        issue.createdBy || 'N/A',
        new Date(issue.createdAt).toLocaleString(),
        new Date(issue.updatedAt).toLocaleString(),
        issue.photos?.length || 0,
        issue.comments?.length || 0,
        (issue.assignedTo || []).join('; ')
      ])

      // Build CSV string
      const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ]

      const csvContent = csvRows.join('\n')

      // Set headers for CSV download
      setResponseHeaders(event, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="incidencias-${obraId}-${timestamp}.csv"`
      })

      return csvContent
    } else if (format === 'pdf') {
      // For PDF, return a simple JSON for now (full PDF generation would require additional libraries)
      // The frontend can handle PDF generation using this data
      const exportData = {
        obra: {
          id: obraId,
          name: obraName
        },
        timestamp: new Date().toISOString(),
        filters: { status, type, priority, assignedTo },
        issues: issues.map(issue => ({
          id: issue._id.toString(),
          title: issue.title,
          type: issue.type,
          status: issue.status,
          priority: issue.priority,
          description: issue.description || '',
          createdBy: issue.createdBy || 'N/A',
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          photoCount: issue.photos?.length || 0,
          commentCount: issue.comments?.length || 0,
          assignedTo: issue.assignedTo || [],
          commentSummaries: (issue.comments || []).map((c: any) => ({
            author: c.userName,
            text: c.text.substring(0, 100) + (c.text.length > 100 ? '...' : ''),
            date: c.createdAt
          }))
        }))
      }

      return exportData
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Formato no soportado. Usa "csv" o "pdf"'
    })
  } catch (error: any) {
    console.error('Issues export error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Error al exportar incidencias'
    })
  }
})
