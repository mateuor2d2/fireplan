import { EmergencyPlan } from '../../../models/EmergencyPlan'
import { connectDB } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const body = await readBody(event)
    const plan = new EmergencyPlan({
      ...body,
      tenantId: user.tenantId,
      createdBy: user._id,
      status: 'draft',
      version: 1,
      phases: [
        { id: 'identification', name: 'Identificación', completed: false },
        { id: 'risks', name: 'Análisis de Riesgos', completed: false },
        { id: 'measures', name: 'Medidas Preventivas', completed: false },
        { id: 'organization', name: 'Organización', completed: false },
        { id: 'resources', name: 'Recursos', completed: false },
        { id: 'procedures', name: 'Procedimientos', completed: false },
        { id: 'training', name: 'Formación', completed: false }
      ]
    })

    await plan.save()
    return { success: true, data: plan, message: 'Plan created successfully' }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
