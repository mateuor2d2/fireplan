import { z } from 'zod'
import type { IConcepto, IConceptoCreate } from '../types/conceptos'
import { useDb } from '../utils/db'

// Input validation schema using Zod
const conceptoCreateSchema = z.object({
  nom_concepto: z.string().min(3).max(255),
  desc_concepto: z.string().min(3),
  desc_concepto_preventivo: z.string().optional(),
  tipo_concepto_unidad: z.object({
    id: z.number(),
    descripcion: z.string()
  }),
  precio_concepto: z.number().min(0).optional(),
  capitulo: z.number().min(1),
  capitulo_title: z.string().optional(),
  evaluaciones: z.array(z.any()).optional(),
  epis: z.array(z.any()).optional(),
  pqs: z.array(z.any()).optional(),
  maqs: z.array(z.any()).optional(),
  pcols: z.array(z.any()).optional(),
  medauxs: z.array(z.any()).optional()
})

export default defineEventHandler<
  Promise<{ success: boolean, data: IConcepto }>
>(async (event) => {
  const { Concepto } = useDb()
  const body = await readBody<IConceptoCreate>(event)

  try {
    // Validate input using Zod
    const validationResult = conceptoCreateSchema.safeParse(body)

    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        message: 'Datos de entrada no válidos',
        data: validationResult.error.errors.map(error => error.message)
      })
    }

    // Check if concepto with same name already exists
    const existingConcepto = await Concepto.findOne({
      nom_concepto: body.nom_concepto.trim()
    })

    if (existingConcepto) {
      throw createError({
        statusCode: 409,
        message: 'Ya existe un concepto con este nombre'
      })
    }

    // Create new concepto with trimmed strings
    const newConcepto = new Concepto({
      ...body,
      nom_concepto: body.nom_concepto.trim(),
      desc_concepto: body.desc_concepto.trim(),
      desc_concepto_preventivo: body.desc_concepto_preventivo?.trim() || '',
      precio_concepto: body.precio_concepto || 0,
      evaluaciones: body.evaluaciones || [],
      epis: body.epis || [],
      pqs: body.pqs || [],
      maqs: body.maqs || [],
      pcols: body.pcols || [],
      medauxs: body.medauxs || []
    })

    // Save to database
    const savedConcepto = await newConcepto.save()

    // Convert to plain object and remove sensitive fields
    const result = savedConcepto.toObject()

    return {
      success: true,
      data: result as IConcepto
    }
  } catch (error: any) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      throw createError({
        statusCode: 409,
        message: 'Ya existe un concepto con este nombre',
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
      message: error.message || 'Error al crear el concepto',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
//     const method = event.method;
//     let url = "";

//     if (config.NODE_ENV === "production") {
//       url = config.HK_SERVER + "/mgconceptopss/";
//     } else {
//       url = config.HK_LOCAL + "/mgconceptopss/";
//     }

//     try {
//       if (method === "POST") {
//         const body = await readBody(event);
//         //   const accessToken = getCookie(event, "auth._token.local");
//         const urlplus = "_id=" + body._id;
//         const response = await $fetch<FeathersResponseConcepto>(url + urlplus, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${body.accessToken}`,
//           },
//           body: body.conceptoActual,
//         });

//         return response;
//       }
//     } catch (error) {
//       throw createError({
//         statusCode: 500,
//         statusMessage: `Error creating concepto: ${error}`,
//       });
//     }
//   })
// );
