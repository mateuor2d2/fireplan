// import Joi from 'joi'
import type { IPlan, IPlanCreate } from '../types/planes'
import { useDb } from '../utils/db'
import { createQRService } from '../services/qrService'

export default defineEventHandler<
  Promise<{
    success: boolean
    data: IPlan
    message: string
  }>
>(async (event) => {
  const { Planes } = useDb()
  const body = await readBody<IPlanCreate>(event)

  try {
    // Validate — allow empty strings (template may hide sections); Mongoose validates required
    // Check if user is authenticated
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'No autorizado. Debe iniciar sesión para crear un plan.'
      })
    }

    // Debug logging for admin role issues
    console.log('[planes.post] User ID:', user._id?.toString())
    console.log('[planes.post] User role:', user.role)
    console.log('[planes.post] User role type:', typeof user.role)
    console.log('[planes.post] Is admin check:', user?.role === 'admin')

    // Enforce plan limit (admins bypass this)
    const userPlanCount = await Planes.countDocuments({ createdBy: user._id })
    console.log('[planes.post] User plan count:', userPlanCount)
    requirePlanLimit(event, 'maxPlans', userPlanCount, 'planes de seguridad')

    // Check if plan with same name already exists for this user (skip if name is empty/default)
    const existingPlan = body.nom_obra?.trim()
      ? await Planes.findOne({
          nom_obra: body.nom_obra.trim(),
          createdBy: user._id
        })
      : null

    if (existingPlan) {
      throw createError({
        statusCode: 409,
        message: 'Ya existe un plan con este nombre'
      })
    }

    // Create new plan with default values for required fields
    const newPlan = new Planes({
      // Obra fields (from body)
      nom_obra: body.nom_obra?.trim() || 'Obra sin nombre',
      desc_obra: body.desc_obra?.trim() || 'Sin descripción',
      desc_condiciones_obra: body.desc_condiciones_obra?.trim() || 'Sin condiciones',
      dir_obra: body.dir_obra?.trim() || 'Sin dirección',
      poblacion_obra: body.poblacion_obra?.trim() || 'Sin población',
      cp_obra: body.cp_obra?.trim() || '00000',
      perimetro_obra: body.perimetro_obra || 0,
      superficie_construida_obra: body.superficie_construida_obra || 0,
      num_plantas_sobre: body.num_plantas_sobre || 0,
      num_plantas_bajo: body.num_plantas_bajo || 0,
      presupuesto_total_obra: body.presupuesto_total_obra || 0,
      presupuesto_total_seguridad: body.presupuesto_total_seguridad || 0,
      presupuesto_objeto_obra: body.presupuesto_objeto_obra || 0,
      presupuesto_objeto_seguridad: body.presupuesto_objeto_seguridad || 0,
      duracion_meses: body.duracion_meses || 1,
      porcentaje: body.porcentaje || 0,
      precio_hora_euro: body.precio_hora_euro || 0,

      // Required plan fields with default values
      nom_plandeseguridad:
        body.nom_plandeseguridad?.trim() || 'Plan de Seguridad',
      desc_plandeseguridad:
        body.desc_plandeseguridad?.trim()
        || 'Descripción del plan de seguridad',
      num_trab_plan: body.num_trab_plan || 1,
      hay_planos: body.hay_planos || '',

      // Optional plan fields
      entorno_obra: body.entorno_obra || '',
      condiciones_entorno_obra: body.condiciones_entorno_obra || '',
      lineas_aereas: body.lineas_aereas || '',
      conducciones_enterradas: body.conducciones_enterradas || '',
      estado_medianeras: body.estado_medianeras || '',
      acometidas: body.acometidas || '',
      interferencias_edificios: body.interferencias_edificios || '',
      servidumbres_de_paso: body.servidumbres_de_paso || '',
      trafico: body.trafico || '',
      instalacion_electrica: body.instalacion_electrica || '',
      instalacion_agua: body.instalacion_agua || '',
      centro_asistencial: body.centro_asistencial || '',
      centro_asistencial_primaria: body.centro_asistencial_primaria || '',
      num_extintoresco2: body.num_extintoresco2 || '',
      num_extintoresabc: body.num_extintoresabc || '',
      num_duchas: body.num_duchas || '',
      num_lavabos: body.num_lavabos || '',
      num_comedores: body.num_comedores || '',
      num_vestuarios: body.num_vestuarios || '',
      contenido_botiquin: body.contenido_botiquin || '',
      orografia: body.orografia || '',
      clima: body.clima || '',
      condiciones_clima: body.condiciones_clima || '',

      // Contratista and Promotor with default values
      contratista: {
        nom_contratista:
          body.contratista?.nom_contratista?.trim() || 'Contratista',
        cif_contratista: body.contratista?.cif_contratista?.trim() || 'CIF',
        dir_contratista:
          body.contratista?.dir_contratista?.trim() || 'Dirección',
        localidad_contratista:
          body.contratista?.localidad_contratista?.trim() || 'Localidad',
        cp_contratista: body.contratista?.cp_contratista?.trim() || '00000',
        telf_contratista:
          body.contratista?.telf_contratista?.trim() || '000000000',
        nom_recurso_preventivo:
          body.contratista?.nom_recurso_preventivo?.trim()
          || 'Recurso Preventivo',
        dni_recurso_preventivo:
          body.contratista?.dni_recurso_preventivo?.trim() || 'DNI',
        telf_recurso_preventivo:
          body.contratista?.telf_recurso_preventivo?.trim() || '000000000',
        email_contratista:
          body.contratista?.email_contratista?.toLowerCase().trim()
          || 'contratista@example.com'
      },
      promotor: {
        nom_promotor: body.promotor?.nom_promotor?.trim() || 'Promotor',
        cif_promotor: body.promotor?.cif_promotor?.trim() || 'CIF',
        dir_promotor: body.promotor?.dir_promotor?.trim() || 'Dirección',
        localidad_promotor:
          body.promotor?.localidad_promotor?.trim() || 'Localidad',
        cp_promotor: body.promotor?.cp_promotor?.trim() || '00000',
        telf_promotor: body.promotor?.telf_promotor?.trim() || '000000000',
        email_promotor:
          body.promotor?.email_promotor?.toLowerCase().trim()
          || 'promotor@example.com'
      },

      // User fields
      createdBy: user._id,
      updatedBy: user._id,

      // Default empty arrays
      presupuesto: [],
      userPresupuesto: [],
      userCapitulos: [],
      userPartidas: [],
      partidas: [],
      desc_cap_obra: body.desc_cap_obra || []
    })

    // Save to database
    const savedPlan = await newPlan.save()

    // Auto-generate QR code if user has enabled it
    try {
      const { User } = useDb()
      const userData = await User.findById(user._id)

      if (userData?.qrSettings?.autoGenerate !== false) {
        console.log('🔄 Auto-generating QR code for new plan:', savedPlan._id)

        const qrService = createQRService({ Plan: Planes, User })

        await qrService.generateForPlan({
          planId: savedPlan._id.toString(),
          userId: user._id.toString(),
          expirationDays: userData?.qrSettings?.expirationDays || 30,
          baseUrl: userData?.qrSettings?.baseUrl || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        })

        console.log('✅ QR code auto-generated for new plan')
      }
    } catch (qrError) {
      // Log QR generation error but don't fail plan creation
      console.error('❌ QR auto-generation failed (plan created successfully):', qrError)
    }

    // Populate createdBy and updatedBy fields with user info
    const populatedPlan = await Planes.findById(savedPlan._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean()

    return {
      success: true,
      data: populatedPlan as IPlan,
      message: 'Plan creado exitosamente'
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
      message: error.message || 'Error al crear el plan',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
