import { Types, type FlattenMaps } from 'mongoose'
import { useDb } from '../utils/db'
import type { IConceptoDocument } from '../types/conceptos'

// Define the shape of the lean document we expect from MongoDB
interface IConceptoLean {
  _id: Types.ObjectId
  nom_concepto: string
  desc_concepto: string
  capitulo: number
  emailuser?: string
  mgroluser?: string
  mguser?: Types.ObjectId
  [key: string]: any // Allow other properties we don't explicitly type
}

interface SearchFilter {
  [key: string]: any
  $or?: Array<{ [key: string]: any }>
  capitulo?: number
  mguser?: Types.ObjectId
}

interface IConceptoResponse {
  data: Array<{
    _id: Types.ObjectId | string // Accept both ObjectId and string
    nom_concepto: string
    desc_concepto: string
    capitulo: number
    emailuser?: string
    mgroluser?: string
  }>
  total: number
  limit: number
  skip: number
}

export default defineEventHandler<Promise<IConceptoResponse>>(async (event) => {
  const { Concepto, Users } = useDb()
  const query = getQuery(event)
  const {
    $limit = '10',
    $skip = '0',
    search,
    searchField,
    capitulo,
    userId
  } = query

  try {
    // Check if user is admin
    let isAdmin = false
    let requestingUserId = null

    // First try to get user from authenticated context
    const authenticatedUser = event.context.user
    if (authenticatedUser) {
      try {
        // Handle both _id (MongoDB) and id (JWT) formats
        const userIdStr = authenticatedUser._id?.toString() || authenticatedUser.id?.toString()
        if (userIdStr) {
          requestingUserId = Types.ObjectId.createFromHexString(userIdStr)
          isAdmin = authenticatedUser.role === 'admin'
        }
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
      } catch (error) {
        console.error('Error checking user role:', error)
      }
    }

    // Define base filter
    const filter: SearchFilter = {}

    // Check if this is a filtered request (when user wants to see only their own)
    const showOnlyOwn = query.showOnlyOwn === 'true'

    console.log(
      `DEBUG: showOnlyOwn=${showOnlyOwn}, typeof showOnlyOwn=${typeof showOnlyOwn}, isAdmin=${isAdmin}, requestingUserId=${requestingUserId}`
    )
    console.log(
      `DEBUG: Condition checks - showOnlyOwn && requestingUserId: ${showOnlyOwn && requestingUserId}, !isAdmin && requestingUserId: ${!isAdmin && requestingUserId}, isAdmin && requestingUserId && showOnlyOwn === false: ${isAdmin && requestingUserId && showOnlyOwn === false}, isAdmin && requestingUserId: ${isAdmin && requestingUserId}`
    )

    if (showOnlyOwn && requestingUserId) {
      // Explicitly requested to show only own conceptos
      console.log(
        'DEBUG: Applying filter for showOnlyOwn - showing only user conceptos'
      )
      if (isAdmin) {
        // Admin: "mis conceptos" = mis conceptos propios + conceptos para todos (mgroluser: 'admin')
        filter.$or = [
          { mguser: requestingUserId }, // Admin's own conceptos
          { mgroluser: 'admin' } // Conceptos para todos
        ]
      } else {
        // Regular user: solo sus conceptos
        filter.mguser = requestingUserId
      }
    } else if (!isAdmin && requestingUserId) {
      // Regular users default: show their own + admin conceptos
      console.log(
        'DEBUG: Applying filter for regular user - showing user + admin conceptos'
      )
      filter.$or = [
        { mguser: requestingUserId }, // User's own conceptos
        { mgroluser: 'admin' } // Admin conceptos
      ]
    } else if (isAdmin && requestingUserId && showOnlyOwn === false) {
      // Admin users when showOnlyOwn is explicitly false: show all conceptos (no filter)
      console.log('DEBUG: No filter applied for admin - showing all conceptos')
    } else if (isAdmin && requestingUserId) {
      // Admin users default (when showOnlyOwn is not explicitly false): show only their own conceptos
      console.log(
        'DEBUG: Applying filter for admin default - showing only admin conceptos'
      )
      filter.$or = [
        { mguser: requestingUserId }, // Admin's own conceptos
        { mgroluser: 'admin' } // Conceptos para todos
      ]
    } else {
      console.log('DEBUG: No specific filter applied - showing all conceptos')
    }

    console.log(
      `API conceptos.getMiniConceptos - isAdmin: ${isAdmin}, showOnlyOwn: ${showOnlyOwn}, requestingUserId: ${requestingUserId}, capitulo: ${capitulo}`
    )

    // Filter by chapter if specified
    if (capitulo) {
      const capituloNum = Number(capitulo)
      if (!isNaN(capituloNum)) {
        filter.capitulo = capituloNum
      }
    }

    // Apply search filter if search term is provided
    if (search) {
      const searchTerm = search.toString().trim()

      if (searchField === 'all' || !searchField) {
        // Search across text fields using regex
        const textSearchConditions = [
          { nom_concepto: { $regex: searchTerm, $options: 'i' } },
          { desc_concepto: { $regex: searchTerm, $options: 'i' } },
          {
            'tipo_concepto_unidad.descripcion': {
              $regex: searchTerm,
              $options: 'i'
            }
          }
        ]

        // If we have a capitulo filter, search within that capitulo
        if (filter.capitulo) {
          filter.$or = [
            { capitulo: filter.capitulo, $or: textSearchConditions }
          ]
        } else {
          filter.$or = textSearchConditions
        }
      } else if (searchField === 'capitulo') {
        // Handle capitulo search by number or name
        const capituloNum = Number(searchTerm)
        if (!isNaN(capituloNum)) {
          // If search term is a number, search by capitulo number
          filter.capitulo = capituloNum
        } else {
          // If search term is text, search in capitulos descriptions
          const capitulos = [
            { id: 1, descripcion: 'TRABAJOS PRELIMINARES' },
            { id: 2, descripcion: 'MOVIMIENTOS DE TIERRAS' },
            { id: 3, descripcion: 'CIMIENTOS' },
            { id: 4, descripcion: 'ESTRUCTURA' },
            { id: 5, descripcion: 'CUBIERTA' },
            { id: 6, descripcion: 'CERRAJERIA' },
            { id: 7, descripcion: 'REVESTIMIENTOS' },
            { id: 8, descripcion: 'ACABADOS' },
            { id: 9, descripcion: 'CARPINTERIA' },
            { id: 10, descripcion: 'INSTALACIONES' },
            { id: 11, descripcion: 'SANEAMIENTO' },
            { id: 12, descripcion: 'ACONDICIONAMIENTO EXTERIOR' },
            { id: 13, descripcion: 'DEMOLICIONES' },
            { id: 14, descripcion: 'OTROS' }
          ]

          // Find capitulos where description contains the search term (case insensitive)
          const matchingCapitulos = capitulos.filter(c =>
            c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
          )

          if (matchingCapitulos.length > 0) {
            // If we found matching capitulos, search in all of them
            filter.$or = matchingCapitulos.map(c => ({ capitulo: c.id }))
          } else {
            // If no matches found, return empty result
            filter.capitulo = -1 // This will return no results
          }
        }
      } else {
        // For other fields, use regex search
        filter[searchField] = { $regex: searchTerm, $options: 'i' }
      }
    }

    // Parse pagination parameters
    const limit = Math.min(Number($limit) || 10, 100) // Max 100 items per page
    const skip = Math.max(0, Number($skip) || 0)

    // Get total count for pagination
    const total = await Concepto.countDocuments(filter)
    console.log(
      `Found ${total} total conceptos for capitulo ${capitulo || 'all'}`
    )

    // Define fields to select (matching MiniConcepto interface)
    const selectFields = [
      '_id',
      'nom_concepto',
      'desc_concepto',
      'capitulo',
      'emailuser',
      'mgroluser',
      'mguser' // Add mguser field to selection
    ].join(' ')

    // Get paginated results with only the required fields
    const conceptos = await Concepto.find<IConceptoLean>(filter)
      .select(selectFields)
      .sort({ capitulo: 1, nom_concepto: 1 })
      .skip(skip)
      .limit(limit)
      .lean<IConceptoLean[]>()
      .exec()

    // For admin view, get user information for each concepto's owner
    const userMap = new Map()
    if (isAdmin) {
      const ownerIds = [
        ...new Set(
          conceptos
            .map(concepto => concepto.mguser?.toString())
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

    // Map the documents to the expected response format
    const mappedConceptos = conceptos.map((doc) => {
      const ownerInfo
        = isAdmin && doc.mguser ? userMap.get(doc.mguser.toString()) : null
      return {
        _id: doc._id,
        nom_concepto: doc.nom_concepto,
        desc_concepto: doc.desc_concepto,
        capitulo: doc.capitulo,
        emailuser: doc.emailuser,
        mgroluser: doc.mgroluser,
        mguser: doc.mguser,
        isAdminView: isAdmin,
        isOwner: isAdmin
          ? doc.mguser?.toString() === requestingUserId?.toString()
          : doc.mguser?.toString() === requestingUserId?.toString(),
        ownerName: ownerInfo?.name || 'Usuario desconocido',
        ownerEmail: ownerInfo?.email || '',
        isAdminConcepto: doc.mgroluser === 'admin'
      }
    })

    return {
      data: mappedConceptos,
      total,
      limit,
      skip
    }
  } catch (error: any) {
    console.error('Error in conceptos.getMiniConceptos:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al obtener el listado de mini conceptos',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
