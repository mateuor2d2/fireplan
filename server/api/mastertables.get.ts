import { defineEventHandler } from 'h3'
import chalk from 'chalk'
import type { Types } from 'mongoose'
import { db } from '../utils/db'

// Base interface that matches the store's MasterTableItem
interface MasterTableItem {
  _id?: string | Types.ObjectId
  id: number
  description: string
  isDefault?: boolean
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  updatedBy?: string
  mguser?: string | Types.ObjectId
  [key: string]: unknown
}

// Interface for the response format expected by the store
interface MasterTableResponse {
  default: MasterTableItem[]
  user: MasterTableItem[]
}

// Helper function to log MongoDB queries
const logQuery = (name: string, query: any) => {
  console.log(chalk.blue(`\n=== ${name} Query ===`))
  console.log('Collection:', query.mongooseCollection.name)
  console.log('Conditions:', query._conditions)
  console.log('Options:', {
    sort: query.options.sort,
    limit: query.options.limit,
    skip: query.options.skip,
    fields: query._fields
  })
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { type: tableType, userId, $limit = '100', $skip = '0', search } = query

    console.log(chalk.yellow('\n=== New Request ==='))
    console.log('URL:', event.node.req.url)
    console.log('Query Params:', query)

    if (!tableType) {
      throw createError({
        statusCode: 400,
        message: 'Table type is required'
      })
    }

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      })
    }

    // Get the mastertable model
    const Model = db.MasterTable('mastertable')

    // Log the request for debugging
    console.log(chalk.blue('MasterTables API Request:'), {
      tableType,
      userId,
      limit: $limit,
      skip: $skip,
      search
    })

    // Helper function to transform MongoDB documents to match store's expected format
    const transformDoc = (doc: any) => {
      // Map the document fields to match the store's expected format
      return {
        _id: doc._id?.toString(),
        id: doc.order || 0, // Use order as id if available, otherwise default to 0
        description: doc.description || doc.name || doc.descripcion || '', // Map description/name to descripcion
        name: doc.name || doc.descripcion || '', // Keep original name
        isDefault: doc.isDefault || false,
        isActive: doc.isActive !== undefined ? doc.isActive : true,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        createdBy: doc.createdBy,
        updatedBy: doc.updatedBy,
        mguser: doc.mguser?.toString(),
        type: doc.type // Keep the type field
      }
    }

    // Build the filter
    const filter: any = {
      type: tableType, // Filter by the requested type
      $or: [
        { isDefault: true },
        { isDefault: false, mguser: userId }
      ]
    }

    // Add search filter if provided
    if (search) {
      const searchRegex = new RegExp(search.toString(), 'i')
      filter.$or = filter.$or.map((cond: any) => ({
        ...cond,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { descripcion: searchRegex }
        ]
      }))
    }

    // Log the filter being used
    console.log(chalk.blue('MongoDB Filter:'), JSON.stringify(filter, null, 2))

    // Basic model and database connection check
    console.log(chalk.blue('\n=== Database Connection Check ==='))
    console.log('Model:', {
      modelName: Model.modelName,
      collectionName: Model.collection?.name,
      dbName: Model.db?.name,
      dbHost: Model.db?.host
    })

    if (!Model.db) {
      console.error(chalk.red('❌ Error: Model is not connected to a database'))
      return { default: [], user: [] }
    }

    // Get total counts for this type
    const totalCount = await Model.countDocuments({ type: tableType })
    console.log(`Total documents for type ${tableType}:`, totalCount)

    // Get counts by isDefault
    const defaultCount = await Model.countDocuments({ type: tableType, isDefault: true })
    const userCount = await Model.countDocuments({ type: tableType, isDefault: false, mguser: userId })
    console.log(`Default items: ${defaultCount}, User items: ${userCount}`)

    // Get sample documents for debugging
    const sampleDocs = await Model.find({ type: tableType }).limit(5).lean()
    console.log('Sample documents:', JSON.stringify(sampleDocs, null, 2))

    // If specifically looking for capitulos, show all of them for debugging
    if (tableType === 'capitulo') {
      const allCapitulos = await Model.find({ type: 'capitulo' }).select('id order description isDefault').lean()
      console.log(`\n=== ALL CAPITULOS IN DATABASE (${allCapitulos.length}) ===`)
      allCapitulos.forEach((cap, index) => {
        console.log(`${index + 1}. ID: ${cap.order || cap.id}, Description: ${cap.description}, Default: ${cap.isDefault}`)
      })
    }

    // Parse pagination parameters
    const limit = Math.min(Number($limit) || 100, 1000)
    const skip = Number($skip) || 0

    console.log(chalk.blue('Pagination params:'), { limit, skip })

    // Execute queries in parallel
    const [defaultItems, userItems] = await Promise.all([
      // Default items (isDefault: true)
      Model.find({
        type: tableType,
        isDefault: true
      })
        .select('-__v')
        .sort({ order: 1, createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec()
        .then((docs) => {
          console.log(chalk.green('Default items found:'), docs.length)
          if (docs.length > 0) {
            console.log(chalk.green('First default item:'), JSON.stringify(docs[0], null, 2))
          }
          return docs.map(transformDoc)
        })
        .catch((error) => {
          console.error(chalk.red('Error fetching default items:'), error)
          return []
        }),

      // User items (isDefault: false and matching userId)
      Model.find({
        type: tableType,
        isDefault: false,
        mguser: userId
      })
        .select('-__v')
        .sort({ order: 1, createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec()
        .then((docs) => {
          console.log(chalk.green('User items found:'), docs.length)
          if (docs.length > 0) {
            console.log(chalk.green('First user item:'), JSON.stringify(docs[0], null, 2))
          }
          return docs.map(transformDoc)
        })
        .catch((error) => {
          console.error(chalk.red('Error fetching user items:'), error)
          return []
        })
    ])

    // Log the response for debugging
    console.log(chalk.blue('MasterTables API Response:'), {
      defaultItems: defaultItems.length,
      userItems: userItems.length
    })

    // Return in the format expected by the store
    return {
      default: defaultItems,
      user: userItems
    }
  } catch (error: any) {
    console.error(chalk.red('Error in mastertables API:'), error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error fetching master tables',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})
