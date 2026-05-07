import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { Issue } = useDb()
  const id = getRouterParam(event, 'id')

  // Check if user is authenticated
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  try {
    const issue = await Issue.findById(id)

    if (!issue) {
      throw createError({
        statusCode: 404,
        message: 'Issue not found'
      })
    }

    // Check if user has permission to delete this issue
    if (event.context.user.role !== 'admin' && issue.createdBy.toString() !== event.context.user._id.toString()) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para eliminar este issue'
      })
    }

    await Issue.findByIdAndDelete(id)

    return {
      success: true,
      message: 'Issue eliminado correctamente'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error deleting issue'
    })
  }
})
