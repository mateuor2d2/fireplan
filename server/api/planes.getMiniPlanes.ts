import { Types } from 'mongoose'
import { useDb } from '../utils/db'

interface IPlanResponse {
  data: any[]
  total: number
  limit: number
  skip: number
}

export default defineEventHandler<Promise<IPlanResponse>>(async (event) => {
  const { Planes, Users } = useDb()
  const query = getQuery(event)
  const { $limit = '10', $skip = '0', search, searchField, userId } = query

  try {
    console.log('planes.getMiniPlanes called with query:', query)

    // Check if user is admin
    let isAdmin = false
    let requestingUserId = null

    // First try to get user from authenticated context
    const authenticatedUser = event.context.user
    console.log('Authenticated user:', authenticatedUser)

    if (authenticatedUser) {
      try {
        requestingUserId = Types.ObjectId.createFromHexString(
          authenticatedUser._id.toString()
        )
        isAdmin = authenticatedUser.role === 'admin'
        console.log(
          'Using authenticated user - isAdmin:',
          isAdmin,
          'requestingUserId:',
          requestingUserId
        )
      } catch (error) {
        console.error(
          'Error creating ObjectId from authenticated user:',
          error
        )
      }
    } else if (userId) {
      // Fallback to userId from query params
      try {
        requestingUserId = Types.ObjectId.createFromHexString(
          userId.toString()
        )
        const user = await Users.findById(requestingUserId)
        isAdmin = user?.role === 'admin'
        console.log(
          'Using query userId - isAdmin:',
          isAdmin,
          'requestingUserId:',
          requestingUserId
        )
      } catch (error) {
        console.error('Error checking user role:', error)
      }
    }

    console.log(
      'Final values - isAdmin:',
      isAdmin,
      'requestingUserId:',
      requestingUserId
    )

    // Define base filter
    const filter: Record<string, any> = {}

    // Build user filter conditions
    const userConditions: any[] = []
    if (!isAdmin && requestingUserId) {
      // Handle both createdBy and mguser fields for legacy support
      userConditions.push(
        { createdBy: requestingUserId },
        { mguser: requestingUserId }
      )
    }

    // Apply search filter if search term is provided
    if (search) {
      const searchRegex = new RegExp(search.toString(), 'i')
      if (searchField === 'all' || !searchField) {
        const searchConditions = [
          { nom_obra: searchRegex },
          { dir_obra: searchRegex },
          { poblacion_obra: searchRegex },
          { nom_contratista: searchRegex },
          { nom_promotor: searchRegex }
        ]

        // Combine user and search conditions
        if (userConditions.length > 0) {
          filter.$and = [{ $or: userConditions }, { $or: searchConditions }]
        } else {
          filter.$or = searchConditions
        }
      } else {
        filter[searchField as string] = searchRegex
        if (userConditions.length > 0) {
          filter.$or = userConditions
        }
      }
    } else if (userConditions.length > 0) {
      filter.$or = userConditions
    }

    // Parse pagination parameters
    const limit = Math.min(Number($limit) || 10, 100) // Max 100 items per page
    const skip = Number($skip) || 0

    console.log('Filter object:', JSON.stringify(filter, null, 2))

    // Get total count for pagination
    const total = await Planes.countDocuments(filter)
    console.log('Total documents found:', total)

    // Define fields to select (matching MiniPlan interface)
    // Include both flat and nested structures for backward compatibility
    const selectFields = [
      '_id',
      'nom_obra',
      'dir_obra',
      'poblacion_obra',
      'cp_obra',
      'paymentStatus',
      'createdBy',
      'contratista.nom_contratista',
      'promotor.nom_promotor',
      'nom_contratista',
      'nom_promotor'
    ].join(' ')

    console.log('Select fields:', selectFields)

    // Get paginated results with only the required fields
    console.log('Executing find query with filter and select fields')
    const planes = await Planes.find(filter)
      .select(selectFields + ' mguser') // Also select mguser for legacy support
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    console.log('Found planes:', planes.length)

    // For admin view, get user information for each plan's owner
    const userMap = new Map()
    if (isAdmin) {
      // Handle both createdBy and mguser fields for legacy support
      const ownerIds = [
        ...new Set(
          planes
            .map((plan) => {
              const userId = plan.createdBy || (plan as any).mguser
              return userId?.toString()
            })
            .filter(Boolean)
        )
      ]
      if (ownerIds.length > 0) {
        const owners = await Users.find({
          _id: {
            $in: ownerIds.map(id => Types.ObjectId.createFromHexString(id))
          }
        })
          .select('name email')
          .lean()
        owners.forEach(user => userMap.set(user._id.toString(), user))
      }
    }

    // Transform the data to match the MiniPlan interface
    const miniPlanes = planes.map((plan) => {
      // Handle both createdBy and mguser fields for legacy support
      const userId = plan.createdBy || (plan as any).mguser
      const userIdStr = userId?.toString()
      const ownerInfo = isAdmin && userId ? userMap.get(userIdStr) : null

      // Handle both nested and flat contratista structure for backward compatibility
      const nomContratista
        = plan.contratista?.nom_contratista
          || (plan as any).nom_contratista
          || ''
      const nomPromotor
        = plan.promotor?.nom_promotor || (plan as any).nom_promotor || ''

      return {
        _id: plan._id,
        nom_obra: plan.nom_obra,
        dir_obra: plan.dir_obra,
        poblacion_obra: plan.poblacion_obra,
        cp_obra: plan.cp_obra,
        pagado: plan.paymentStatus === 'paid',
        createdBy: userId,
        isAdminView: isAdmin,
        isOwner: isAdmin ? userIdStr === requestingUserId?.toString() : true,
        ownerName: ownerInfo?.name || 'Usuario desconocido',
        ownerEmail: ownerInfo?.email || '',
        nom_promotor: nomPromotor,
        nom_contratista: nomContratista
      }
    })

    return {
      data: miniPlanes,
      total,
      limit,
      skip
    }
  } catch (error: any) {
    console.error('Error in planes.getMiniPlanes:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al obtener el listado de mini planes',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
