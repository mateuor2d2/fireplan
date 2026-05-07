import { useDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { Concepto, Planes } = useDb()
  const query = getQuery(event)
  const { q: searchTerm, type = 'all' } = query

  if (!searchTerm) {
    throw createError({
      statusCode: 400,
      message: 'Search term is required'
    })
  }

  try {
    const searchRegex = new RegExp(searchTerm.toString(), 'i')

    const results = {
      conceptos: [],
      planes: []
    }

    // Search in conceptos
    if (type === 'all' || type === 'conceptos') {
      results.conceptos = await Concepto.find({
        $or: [
          { nom_concepto: searchRegex },
          { desc_concepto: searchRegex },
          { 'tipo_concepto_unidad.descripcion': searchRegex },
          { desc_concepto_preventivo: searchRegex }
        ]
      })
        .limit(10)
        .lean()
    }

    // Search in planes
    if (type === 'all' || type === 'planes') {
      results.planes = await Planes.find({
        $or: [
          { nom_obra: searchRegex },
          { desc_obra: searchRegex },
          { 'contratista.nom_contratista': searchRegex },
          { 'promotor.nom_promotor': searchRegex }
        ]
      })
        .limit(10)
        .lean()
    }

    return results
  } catch (error) {
    console.error('Search error:', error)
    throw createError({
      statusCode: 500,
      message: 'Error performing search'
    })
  }
})
