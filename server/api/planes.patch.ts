import { z } from 'zod'
import type { IPlan } from '../types/planes'
import { useDb } from '../utils/db'

// Input validation schema for updates using Zod
const planUpdateSchema = z
  .object({
    nom_obra: z.string().min(3).max(255).optional(),
    desc_obra: z.string().optional(),
    fecha_inicio: z.date().optional(),
    fecha_fin: z.date().optional(),
    presupuesto: z.array(z.any()).optional(),
    userPresupuesto: z.array(z.any()).optional(),
    userCapitulos: z.array(z.any()).optional(),
    userPartidas: z.array(z.any()).optional(),
    desc_cap_obra: z.array(z.any()).optional(),
    partidas: z.array(z.any()).optional(),
    contratista: z
      .object({
        nom_contratista: z.string().optional(),
        cif_contratista: z.string().optional(),
        dir_contratista: z.string().optional(),
        localidad_contratista: z.string().optional(),
        cp_contratista: z.string().optional(),
        telf_contratista: z.string().optional(),
        email_contratista: z.string().optional(),
        nom_recurso_preventivo: z.string().optional(),
        dni_recurso_preventivo: z.string().optional(),
        telf_recurso_preventivo: z.string().optional()
      })
      .optional(),
    promotor: z
      .object({
        nom_promotor: z.string().optional(),
        cif_promotor: z.string().optional(),
        dir_promotor: z.string().optional(),
        localidad_promotor: z.string().optional(),
        cp_promotor: z.string().optional(),
        telf_promotor: z.string().optional(),
        email_promotor: z.string().optional()
      })
      .optional(),
    // Plan-specific fields
    nom_plandeseguridad: z.string().optional(),
    desc_plandeseguridad: z.string().optional(),
    num_trab_plan: z.union([z.number(), z.string()]).optional(),
    hay_planos: z.string().optional(),
    entorno_obra: z.string().optional(),
    condiciones_entorno_obra: z.string().optional(),
    lineas_aereas: z.string().optional(),
    conducciones_enterradas: z.string().optional(),
    estado_medianeras: z.string().optional(),
    acometidas: z.string().optional(),
    interferencias_edificios: z.string().optional(),
    servidumbres_de_paso: z.string().optional(),
    trafico: z.string().optional(),
    instalacion_electrica: z.string().optional(),
    instalacion_agua: z.string().optional(),
    num_extintoresco2: z.union([z.number(), z.string()]).optional(),
    num_extintoresabc: z.union([z.number(), z.string()]).optional(),
    num_duchas: z.union([z.number(), z.string()]).optional(),
    num_lavabos: z.union([z.number(), z.string()]).optional(),
    num_comedores: z.union([z.number(), z.string()]).optional(),
    num_vestuarios: z.union([z.number(), z.string()]).optional(),
    contenido_botiquin: z.string().optional(),
    centro_asistencial: z.string().optional(),
    centro_asistencial_primaria: z.string().optional(),
    orografia: z
      .union([
        z.string(),
        z.object({
          id: z.number(),
          descripcion: z.string()
        })
      ])
      .optional(),
    clima: z
      .union([
        z.string(),
        z.object({
          idclima: z.number(),
          descripcion: z.string()
        })
      ])
      .optional(),
    condiciones_clima: z.string().optional(),
    // Allow _id in body for identification
    _id: z.string().optional()
  })
  .partial()

export default defineEventHandler<
  Promise<{
    success: boolean
    message: string
    data: IPlan | null
  }>
>(async (event) => {
  const { Planes } = useDb()
  const body = await readBody<Partial<IPlan>>(event)
  const query = getQuery(event)
  // Get ID from query parameter or body
  const id = (query.id as string) || body._id

  console.log('🔍 [API] Received PATCH request for plan ID:', id)
  console.log('🔍 [API] Request body keys:', Object.keys(body))
  if (body.presupuesto) {
    console.log(
      '🔍 [API] Presupuesto data received (first 2 items):',
      body.presupuesto.slice(0, 2)
    )
    console.log(
      '🔍 [API] Total presupuesto items received:',
      body.presupuesto.length
    )
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Se requiere el ID del plan para actualizarlo'
    })
  }

  try {
    // Validate input
    if (Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No se proporcionaron datos para actualizar'
      })
    }

    // Validate input using Zod
    const validationResult = planUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        message: 'Datos de entrada no válidos',
        data: validationResult.error.errors.map(error => error.message)
      })
    }

    // Check if plan exists
    const existingPlan = await Planes.findById(id).lean()
    if (!existingPlan) {
      throw createError({
        statusCode: 404,
        message: 'Plan no encontrado'
      })
    }

    // Prepare updates
    const updates: Partial<IPlan> = { ...body, updatedAt: new Date() }

    // Remove fields that shouldn't be updated
    delete updates._id
    delete updates.createdAt
    delete updates.createdBy

    // Defensive: Ensure contratista/promotor exist on existingPlan
    if (!existingPlan.contratista) existingPlan.contratista = {}
    if (!existingPlan.promotor) existingPlan.promotor = {}

    // Format contratista and promotor fields if they exist in the update
    if (updates.contratista) {
      updates.contratista = {
        ...existingPlan.contratista,
        ...updates.contratista,
        // Ensure required fields are properly formatted
        nom_contratista:
          updates.contratista.nom_contratista?.trim()
          || existingPlan.contratista.nom_contratista,
        cif_contratista:
          updates.contratista.cif_contratista?.trim()
          || existingPlan.contratista.cif_contratista,
        dir_contratista:
          updates.contratista.dir_contratista?.trim()
          || existingPlan.contratista.dir_contratista,
        localidad_contratista:
          updates.contratista.localidad_contratista?.trim()
          || existingPlan.contratista.localidad_contratista,
        cp_contratista:
          updates.contratista.cp_contratista?.trim()
          || existingPlan.contratista.cp_contratista,
        telf_contratista:
          updates.contratista.telf_contratista?.trim()
          || existingPlan.contratista.telf_contratista,
        email_contratista:
          updates.contratista.email_contratista?.trim()
          || existingPlan.contratista.email_contratista,
        nom_recurso_preventivo:
          updates.contratista.nom_recurso_preventivo?.trim()
          || existingPlan.contratista.nom_recurso_preventivo,
        dni_recurso_preventivo:
          updates.contratista.dni_recurso_preventivo?.trim()
          || existingPlan.contratista.dni_recurso_preventivo,
        telf_recurso_preventivo:
          updates.contratista.telf_recurso_preventivo?.trim()
          || existingPlan.contratista.telf_recurso_preventivo
      }
    }

    if (updates.promotor) {
      updates.promotor = {
        ...existingPlan.promotor,
        ...updates.promotor,
        // Ensure required fields are properly formatted
        nom_promotor:
          updates.promotor.nom_promotor?.trim()
          || existingPlan.promotor.nom_promotor,
        cif_promotor:
          updates.promotor.cif_promotor?.trim()
          || existingPlan.promotor.cif_promotor,
        dir_promotor:
          updates.promotor.dir_promotor?.trim()
          || existingPlan.promotor.dir_promotor,
        localidad_promotor:
          updates.promotor.localidad_promotor?.trim()
          || existingPlan.promotor.localidad_promotor,
        cp_promotor:
          updates.promotor.cp_promotor?.trim()
          || existingPlan.promotor.cp_promotor,
        telf_promotor:
          updates.promotor.telf_promotor?.trim()
          || existingPlan.promotor.telf_promotor,
        email_promotor:
          updates.promotor.email_promotor?.trim()
          || existingPlan.promotor.email_promotor
      }
    }

    // Transform object fields that should be strings in the database
    if (updates.clima && typeof updates.clima === 'object') {
      // If clima is an object like { idclima: 1, descripcion: 'clima Moderado' }, extract the descripcion
      const climaObj = updates.clima as any
      updates.clima
        = climaObj.descripcion || climaObj.idclima?.toString() || ''
    }

    // Handle other similar object-to-string transformations if needed
    if (updates.orografia && typeof updates.orografia === 'object') {
      const orografiaObj = updates.orografia as any
      updates.orografia
        = orografiaObj.descripcion || orografiaObj.id?.toString() || ''
    }

    // Trim string fields
    if (updates.nom_obra) updates.nom_obra = updates.nom_obra.trim()
    if (updates.desc_obra) updates.desc_obra = updates.desc_obra.trim()

    // Convert numeric fields from string to number for plan-specific fields
    const numericFields = [
      'num_trab_plan',
      'num_extintoresco2',
      'num_extintoresabc',
      'num_duchas',
      'num_lavabos',
      'num_comedores',
      'num_vestuarios'
    ]

    numericFields.forEach((field) => {
      if (
        field in updates
        && updates[field] !== null
        && updates[field] !== undefined
      ) {
        updates[field] = Number(updates[field]) || 0
      }
    })

    console.log(
      '[PATCH /api/planes] Final updates to apply:',
      JSON.stringify(updates, null, 2)
    )

    // Debug: Check if presupuesto is in the updates
    if (updates.presupuesto) {
      console.log(
        '🔍 [API] About to update presupuesto in database (first item):',
        updates.presupuesto[0]
      )
    }

    // Update the plan
    console.log('🔍 [API] Calling Planes.findByIdAndUpdate with ID:', id)
    const updatedPlan = await Planes.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    ).lean()

    console.log('🔍 [API] Database update completed')
    if (updatedPlan?.presupuesto) {
      console.log(
        '🔍 [API] Updated plan presupuesto (first item):',
        updatedPlan.presupuesto[0]
      )
    }

    if (!updatedPlan) {
      throw createError({
        statusCode: 500,
        message: 'Error al actualizar el plan'
      })
    }

    return {
      success: true,
      message: 'Plan actualizado correctamente',
      data: updatedPlan as IPlan
    }
  } catch (error: any) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        message: 'Ya existe un plan con este nombre',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message)
      throw createError({
        statusCode: 400,
        message: `Error de validación: ${messages.join(', ')}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }

    // Handle other errors
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al actualizar el plan',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
