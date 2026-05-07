import chalk from 'chalk'
import type { IPlan, IPlanResponse } from '../types/planes'
import { useDb } from '../utils/db'

export default defineEventHandler<Promise<IPlan | IPlanResponse>>(
  async (event) => {
    const { Planes } = useDb()
    const query = getQuery(event)
    const {
      _id,
      $limit = '10',
      $skip = '0',
      search,
      searchField,
      userId
    } = query

    try {
      // Handle single plan by ID
      if (_id) {
        const plan = await Planes.findById(_id)
          .populate('createdBy', 'name email')
          .populate('updatedBy', 'name email')
          .lean()

        if (!plan) {
          throw createError({
            statusCode: 404,
            message: 'Plan no encontrado'
          })
        }

        // Check if user has permission to view this plan
        if (userId && plan.createdBy._id.toString() !== userId) {
          throw createError({
            statusCode: 403,
            message: 'No tienes permiso para ver este plan'
          })
        }

        console.log('[PLANES GET] Returning plan:', {
          planId: plan._id,
          hasQrCode: !!plan.qrCode,
          publicUrl: plan.qrCode?.publicUrl,
          slug: plan.qrCode?.slug
        })

        return plan as IPlan
      }

      // Handle list with pagination and search
      const filter: Record<string, any> = {}

      // Filter by user if userId is provided
      if (userId) {
        filter.createdBy = userId
      }

      // Apply search filter if search term is provided
      if (search) {
        const searchRegex = new RegExp(search.toString(), 'i')
        if (searchField === 'all' || !searchField) {
          filter.$or = [
            { nom_obra: searchRegex },
            { desc_obra: searchRegex },
            { 'contratista.nom_contratista': searchRegex },
            { 'promotor.nom_promotor': searchRegex }
          ]
        } else {
          filter[searchField as string] = searchRegex
        }
      }

      // Parse pagination parameters
      const limit = Math.min(Number($limit) || 10, 100) // Max 100 items per page
      const skip = Number($skip) || 0

      console.log(chalk.blue('Query parameters:'), { filter, limit, skip })

      // Get total count for pagination
      const total = await Planes.countDocuments(filter)

      // Get paginated results
      const planes = await Planes.find(filter)
        .select(['-__v'])
        .populate('createdBy', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      return {
        data: planes as IPlan[],
        total,
        limit,
        skip
      }
    } catch (error: any) {
      console.error(chalk.red('Error in planes.get:'), error)
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || 'Error al obtener los planes',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
)
