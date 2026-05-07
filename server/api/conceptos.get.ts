import chalk from 'chalk'
import type { IConcepto, IConceptoResponse } from '../types/conceptos'
import { useDb } from '../utils/db'

export default defineEventHandler<Promise<IConcepto | IConceptoResponse>>(
  async (event) => {
    const { Concepto } = useDb()
    const query = getQuery(event)
    const {
      _id,
      $limit = '10',
      $skip = '0',
      search,
      searchField,
      capitulo
    } = query

    try {
      // Handle single concept by ID
      if (_id) {
        const concepto = await Concepto.findById(_id).lean()
        if (!concepto) {
          throw createError({
            statusCode: 404,
            message: 'Concepto no encontrado'
          })
        }
        return concepto as IConcepto
      }

      // Handle list with pagination and search
      const filter: Record<string, any> = {}

      // Filter by chapter if specified
      if (capitulo) {
        filter.capitulo = Number(capitulo)
      }

      // Apply search filter if search term is provided
      if (search) {
        const searchRegex = new RegExp(search.toString(), 'i')
        if (searchField === 'all' || !searchField) {
          filter.$or = [
            { nom_concepto: searchRegex },
            { desc_concepto: searchRegex },
            { 'tipo_concepto_unidad.descripcion': searchRegex },
            { desc_concepto_preventivo: searchRegex }
          ]
        } else {
          filter[searchField as string] = searchRegex
        }
      }

      // Parse pagination parameters
      const limit = Math.min(Number($limit) || 10, 100) // Max 100 items per page
      const skip = Number($skip) || 0

      console.log(chalk.magenta('Params for list query:'), {
        filter,
        limit,
        skip
      })

      // Get total count for pagination
      const total = await Concepto.countDocuments(filter)

      // Get paginated results
      const conceptos = await Concepto.find(filter)
        .select(['-__v', '-updatedAt'])
        .sort({ capitulo: 1, nom_concepto: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec()

      return {
        data: conceptos as IConcepto[],
        total,
        limit,
        skip
      }
    } catch (error: any) {
      console.error(chalk.red('Error:', error))
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || 'Error al obtener los conceptos',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
)
