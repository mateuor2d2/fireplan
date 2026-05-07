// ============================================================================
// Issue Comment Deletion Endpoint
// ============================================================================
// DELETE /api/issues/[id]/comments/[commentId]
//
// Deletes a comment from an issue
// Only allows deletion by comment author or admins
//
// ============================================================================

import { useDb } from '../../../../utils/db'

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
    const commentId = getRouterParam(event, 'commentId')

    if (!issueId || !commentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'ID de incidencia y comentario son requeridos'
      })
    }

    // Find issue
    const issue = await Issue.findById(issueId)

    if (!issue) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Incidencia no encontrada'
      })
    }

    // Find comment
    const commentIndex = issue.comments?.findIndex(c => c.id === commentId)

    if (commentIndex === undefined || commentIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Comentario no encontrado'
      })
    }

    const comment = issue.comments[commentIndex]

    // Check ownership (author or admin)
    const isAuthor = comment.userId === user._id.toString()
    const isAdmin = user.role === 'admin'

    if (!isAuthor && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Solo el autor o un admin puede eliminar este comentario'
      })
    }

    // Remove comment using $pull
    await Issue.updateOne(
      { _id: issueId },
      {
        $pull: { comments: { id: commentId } },
        $set: { updatedAt: new Date() }
      }
    )

    return {
      success: true,
      message: 'Comentario eliminado correctamente'
    }
  } catch (error: any) {
    console.error('Comment deletion error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Error al eliminar comentario'
    })
  }
})
