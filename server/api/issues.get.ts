import { useDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { Planes, Issue } = useDb()
  const query = getQuery(event)
  const obraId = query.obraId as string

  // Check if user is authenticated
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  if (!obraId) {
    throw createError({
      statusCode: 400,
      message: 'Obra ID is required'
    })
  }

  try {
    // Verify user has access to this plan/obra
    const plan = await Planes.findById(obraId)
    if (!plan) {
      throw createError({
        statusCode: 404,
        message: 'Plan not found'
      })
    }

    // Check if user has permission to view this plan
    if (
      event.context.user.role !== 'admin'
      && plan.createdBy.toString() !== event.context.user._id.toString()
    ) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para ver los issues de este plan'
      })
    }

    // Fetch issues for this obra
    const issues = await Issue.find({ obraId }).sort({ createdAt: -1 })

    return {
      success: true,
      data: issues
    }
  } catch (error: any) {
    console.error('Error fetching issues:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch issues'
    })
  }
})
