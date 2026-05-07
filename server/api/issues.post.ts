import { useDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { Planes, Issue } = useDb()
  const body = await readBody(event)

  // Check if user is authenticated
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  try {
    const { obraId, title, description, type, priority } = body

    // Verify user has access to this plan
    const plan = await Planes.findById(obraId)
    if (!plan) {
      throw createError({
        statusCode: 404,
        message: 'Plan not found'
      })
    }

    // Check if user has permission to create issues for this plan
    if (
      event.context.user.role !== 'admin'
      && plan.createdBy.toString() !== event.context.user._id.toString()
    ) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para crear issues para este plan'
      })
    }

    const issue = new Issue({
      obraId,
      title,
      description,
      type,
      priority,
      createdBy: event.context.user._id,
      photos: [],
      comments: []
    })

    const savedIssue = await issue.save()

    return {
      data: savedIssue,
      success: true
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Error creating issue'
    })
  }
})
