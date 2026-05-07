import Handlebars from 'handlebars'
import { cleanTemplate, validateAndFixTemplate, fixHelperIssues } from './templateValidator'
import { evaluaGP, formatCurrencyLocale, formatNumberLocale } from './templateHelpers'

// Register PDFmake image helper
Handlebars.registerHelper('pdfmakeImage', function (imageData) {
  // Helper para insertar directamente objetos PDFmake de imágenes
  if (!imageData || !imageData.pdfmakeObject) {
    return ''
  }

  // Return the raw PDFmake object as a special marker
  return `__PDFMAKE_OBJECT_START__${JSON.stringify(imageData.pdfmakeObject)}__PDFMAKE_OBJECT_END__`
})

// Register PDFmake image helper with description
Handlebars.registerHelper('pdfmakeImageWithDesc', function (imageData) {
  // Helper para insertar imágenes PDFmake con descripción
  if (!imageData || !imageData.pdfmakeObject) {
    return ''
  }

  const imageObj = imageData.pdfmakeObject
  const description = imageData.description || imageData.name || 'Imagen'

  // Create a stack with image and description
  const stackObject = {
    stack: [
      imageObj,
      {
        text: description,
        fontSize: 12,
        alignment: imageObj.alignment || 'center',
        margin: [0, 5, 0, 15],
        color: '#666'
      }
    ],
    margin: [0, 5, 0, 20],
    unbreakable: true
  }

  return `__PDFMAKE_OBJECT_START__${JSON.stringify(stackObject)}__PDFMAKE_OBJECT_END__`
})
// Remove the circular import - we'll use the functions defined in this file

// Register eq helper correctly for Handlebars with defensive programming
Handlebars.registerHelper('eq', function (arg1, arg2, options) {
  // Defensive check for options parameter
  if (typeof options === 'object' && options !== null) {
    // Standard block helper usage
    if (typeof options.fn === 'function' && typeof options.inverse === 'function') {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this)
    }
  }

  // Fallback for incorrect usage - just return the comparison result
  return arg1 == arg2
})

// Register other basic helpers with similar defensive programming
Handlebars.registerHelper('ne', function (arg1, arg2, options) {
  // Defensive check for options parameter
  if (typeof options === 'object' && options !== null) {
    // Standard block helper usage
    if (typeof options.fn === 'function' && typeof options.inverse === 'function') {
      return (arg1 != arg2) ? options.fn(this) : options.inverse(this)
    }
  }

  // Fallback for incorrect usage - just return the comparison result
  return arg1 != arg2
})

Handlebars.registerHelper('gt', function (arg1, arg2, options) {
  // Defensive check for options parameter
  if (typeof options === 'object' && options !== null) {
    // Standard block helper usage
    if (typeof options.fn === 'function' && typeof options.inverse === 'function') {
      return (arg1 > arg2) ? options.fn(this) : options.inverse(this)
    }
  }

  // Fallback for incorrect usage - just return the comparison result
  return arg1 > arg2
})

Handlebars.registerHelper('lt', function (arg1, arg2, options) {
  // Defensive check for options parameter
  if (typeof options === 'object' && options !== null) {
    // Standard block helper usage
    if (typeof options.fn === 'function' && typeof options.inverse === 'function') {
      return (arg1 < arg2) ? options.fn(this) : options.inverse(this)
    }
  }

  // Fallback for incorrect usage - just return the comparison result
  return arg1 < arg2
})

Handlebars.registerHelper('gte', function (arg1, arg2, options) {
  // Defensive check for options parameter
  if (typeof options === 'object' && options !== null) {
    // Standard block helper usage
    if (typeof options.fn === 'function' && typeof options.inverse === 'function') {
      return (arg1 >= arg2) ? options.fn(this) : options.inverse(this)
    }
  }

  // Fallback for incorrect usage - just return the comparison result
  return arg1 >= arg2
})

Handlebars.registerHelper('lte', function (arg1, arg2, options) {
  // Defensive check for options parameter
  if (typeof options === 'object' && options !== null) {
    // Standard block helper usage
    if (typeof options.fn === 'function' && typeof options.inverse === 'function') {
      return (arg1 <= arg2) ? options.fn(this) : options.inverse(this)
    }
  }

  // Fallback for incorrect usage - just return the comparison result
  return arg1 <= arg2
})

// Register the missing 'or' helper - CRITICAL FIX
Handlebars.registerHelper('or', function (...args) {
  // Remove the options object from arguments
  const options = args[args.length - 1]
  const operands = args.slice(0, -1)

  // Check if any operand is truthy
  for (const operand of operands) {
    if (operand) return operand
  }

  // If no operands are truthy, return false
  return false
})

// Register the missing evaluaGP helper
Handlebars.registerHelper('evaluaGP', evaluaGP)

// Register formatting helpers - use the ones from templateHelpers
Handlebars.registerHelper('formatCurrency', formatCurrencyLocale)
Handlebars.registerHelper('formatCurrencyLocale', formatCurrencyLocale)
Handlebars.registerHelper('formatNumber', formatNumberLocale)
Handlebars.registerHelper('formatNumberLocale', formatNumberLocale)

// Register essential array and loop helpers - CRITICAL FIX
Handlebars.registerHelper('each', function (context, options) {
  if (!context || !Array.isArray(context)) return ''
  let result = ''
  for (let i = 0; i < context.length; i++) {
    result += options.fn(context[i], { data: { index: i, first: i === 0, last: i === context.length - 1 } })
  }
  return result
})

Handlebars.registerHelper('if', function (condition, options) {
  if (condition) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
})

Handlebars.registerHelper('unless', function (condition, options) {
  if (!condition) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
})

Handlebars.registerHelper('length', function (array) {
  return array ? array.length : 0
})

Handlebars.registerHelper('get', function (array, index, property) {
  if (!array || !Array.isArray(array) || index >= array.length) return ''
  const item = array[index]
  return property ? item[property] : item
})

Handlebars.registerHelper('with', function (context, options) {
  return options.fn(context)
})

// Register custom image helper for positioning and sizing
Handlebars.registerHelper('image', function (src, options) {
  // Default values
  let position = 'center'
  let width = 'auto'
  let height = 'auto'
  let alt = 'Image'

  // Extract parameters from options hash
  if (options.hash) {
    if (options.hash.position) position = options.hash.position
    if (options.hash.width) width = options.hash.width
    if (options.hash.height) height = options.hash.height
    if (options.hash.alt) alt = options.hash.alt
  }

  // Validate position values
  const validPositions = ['left', 'center', 'right']
  if (!validPositions.includes(position)) {
    position = 'center'
  }

  // Create style based on position
  let style = ''
  switch (position) {
    case 'left':
      style = 'text-align: left;'
      break
    case 'right':
      style = 'text-align: right;'
      break
    case 'center':
    default:
      style = 'text-align: center;'
      break
  }

  // Add width and height if specified
  if (width !== 'auto') {
    style += ` width: ${width}px;`
  }
  if (height !== 'auto') {
    style += ` height: ${height}px;`
  }

  // Return HTML for the image
  return new Handlebars.SafeString(
    `<div style="${style}">`
    + `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto;" />`
    + `</div>`
  )
})

// Register helper to handle newlines in table cells
Handlebars.registerHelper('tableCell', function (text) {
  if (!text) return ''

  // Replace newlines with HTML line breaks for table cell compatibility
  const processedText = String(text).replace(/\n/g, '<br>')
  return new Handlebars.SafeString(processedText)
})

// Register helper to handle newlines by replacing with spaces
Handlebars.registerHelper('noNewlines', function (text) {
  if (!text) return ''

  // Replace newlines with spaces
  const processedText = String(text).replace(/\n/g, ' ')
  return processedText
})

// Register helper to handle newlines with HTML line breaks
Handlebars.registerHelper('br', function (text) {
  if (!text) return ''

  // Replace newlines with HTML line breaks
  const processedText = String(text).replace(/\n/g, '<br>')
  return new Handlebars.SafeString(processedText)
})

/**
 * Template rendering utility using Handlebars for safety plan templates
 * Handles variable substitution in markdown templates with Handlebars syntax
 */

/**
 * Render a template string with provided data using Handlebars
 * @param template - The template string with {{variable}} placeholders
 * @param data - The data object to substitute variables
 * @returns Rendered string with variables replaced
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  if (!template) return ''

  try {
    void('Template content:', template)
    void('Template data:', data)
    void('Template data keys:', Object.keys(data))

    // Clean and validate the template
    const cleanedTemplate = cleanTemplate(template)
    void('Cleaned template:', cleanedTemplate)

    // Validate and fix common issues
    let validatedTemplate = validateAndFixTemplate(cleanedTemplate)
    void('Validated template:', validatedTemplate)

    // Fix specific helper issues
    validatedTemplate = fixHelperIssues(validatedTemplate)
    void('Template after helper fixes:', validatedTemplate)

    // Create a deep copy of data to avoid potential issues
    const templateData = JSON.parse(JSON.stringify(data))

    // Check if template contains helpers that might be causing issues
    const helpersUsed = validatedTemplate.match(/{{[#^/]\w+[^}]*}}/g)
    if (helpersUsed) {
      void('Helpers found in template:', helpersUsed)
    }

    const compiledTemplate = Handlebars.compile(validatedTemplate)
    const result = compiledTemplate(templateData)
    void('Rendered result:', result)

    // Check if any variables remain unrendered
    const unrenderedVars = result.match(/{{[^}]+}}/g)
    if (unrenderedVars) {
      console.warn('Unrendered variables found:', unrenderedVars)
    }

    return result
  } catch (error) {
    console.error('Handlebars rendering error:', error)
    return `Error: ${(error as Error).message}\n\nTemplate:\n${template}\n\nData keys: ${Object.keys(data).join(', ')}`
  }
}

/**
 * Extract all variables from a template string using Handlebars parsing
 * @param template - The template string to analyze
 * @returns Array of variable names found in the template
 */
export function extractVariables(template: string): string[] {
  if (!template) return []

  try {
    const ast = Handlebars.parse(template)
    const variables: string[] = []

    function extractFromNode(node: any) {
      if (node.type === 'MustacheStatement' || node.type === 'BlockStatement') {
        if (node.path && node.path.original) {
          variables.push(node.path.original)
        }
      }

      if (node.program) {
        node.program.body.forEach(extractFromNode)
      }

      if (node.inverse) {
        node.inverse.body.forEach(extractFromNode)
      }

      if (node.body) {
        node.body.forEach(extractFromNode)
      }
    }

    ast.body.forEach(extractFromNode)
    return [...new Set(variables)]
  } catch (error) {
    console.error('Error extracting variables with Handlebars:', error)
    return []
  }
}

/**
 * Enhanced template validation with detailed analysis
 * @param template - The template string to validate
 * @param availableData - Object with available data keys
 * @returns Object with missing variables, available variables, and suggestions
 */
export function validateTemplateData(
  template: string,
  availableData: Record<string, any>
): {
  missing: string[]
  available: string[]
  suggestions: string[]
  warnings: string[]
} {
  const variables = extractVariables(template)
  const missing = []
  const available = []
  const suggestions = []
  const warnings = []

  for (const variable of variables) {
    const keys = variable.split('.')
    let value = availableData
    let found = true

    for (const key of keys) {
      if (value?.[key] === undefined || value?.[key] === null || value?.[key] === '') {
        found = false
        break
      }
      value = value[key]
    }

    if (!found) {
      missing.push(variable)
      // Generate suggestions for similar field names
      const suggestion = findSimilarField(variable, Object.keys(availableData))
      if (suggestion) {
        suggestions.push(`Consider using '${suggestion}' instead of '${variable}'`)
      }

      // Add specific warnings for common field mapping issues
      if (variable.includes('promotor.poblacion')) {
        warnings.push(`Field '${variable}' expects 'promotor.poblacion_promotor' but database has 'localidad_promotor'`)
      }
      if (variable.includes('contratista.poblacion')) {
        warnings.push(`Field '${variable}' expects 'contratista.poblacion_contratista' but database has 'localidad_contratista'`)
      }
    } else {
      available.push(variable)
    }
  }

  return {
    missing,
    available,
    suggestions,
    warnings
  }
}

/**
 * Find similar field names for suggestions
 * @param target - The target field name
 * @param available - Available field names
 * @returns Most similar field name or null
 */
function findSimilarField(target: string, available: string[]): string | null {
  const targetLower = target.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  for (const field of available) {
    const fieldLower = field.toLowerCase()

    // Exact match score
    if (fieldLower === targetLower) {
      return field
    }

    // Partial match scoring
    let score = 0
    if (fieldLower.includes(targetLower)) score += 3
    if (targetLower.includes(fieldLower)) score += 3

    // Word similarity scoring
    const targetWords = targetLower.split(/[._]/)
    const fieldWords = fieldLower.split(/[._]/)

    for (const targetWord of targetWords) {
      for (const fieldWord of fieldWords) {
        if (targetWord === fieldWord) score += 2
        if (targetWord.includes(fieldWord) || fieldWord.includes(targetWord)) score += 1
      }
    }

    // Levenshtein distance for close matches
    if (levenshteinDistance(targetLower, fieldLower) <= 3) {
      score += 1
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = field
    }
  }

  return bestScore >= 2 ? bestMatch : null
}

/**
 * Simple Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Get sample data for template preview
 * @returns Sample data object with common safety plan variables
 */
export function getSampleTemplateData(): Record<string, any> {
  return {
    nom_obra: 'Edificio Residencial Los Pinos',
    dir_obra: 'Calle Mayor 123',
    poblacion_obra: 'Madrid',
    cp_obra: '28001',
    duracion_meses: '18',
    presupuesto_total_obra: '850000',
    superficie_construida_obra: '2500',
    perimetro_obra: '200',
    num_plantas_sobre: '5',
    num_plantas_bajo: '2',
    num_trab_plan: '25',
    presupuesto_total_seguridad: '42500',
    presupuesto_objeto_obra: '800000',
    presupuesto_objeto_seguridad: '40000',
    desc_obra: 'Construcción de edificio residencial de 5 plantas sobre rasante y 2 plantas bajo rasante, con garaje, trasteros y zonas comunes.',
    desc_condiciones_obra: 'Obra en zona urbana con acceso restringido. Presencia de servicios subterráneos. Trabajos en altura requeridos.',
    clima: 'Continental',
    condiciones_clima: 'Veranos calurosos, inviernos fríos',
    orografia: 'Terreno llano',
    contratista: {
      nom_contratista: 'Construcciones Modernas S.L.',
      cif_contratista: 'B12345678',
      dir_contratista: 'Avenida de la Industria 45',
      pob_contratista: 'Madrid',
      cp_contratista: '28002',
      telf_contratista: '912345678',
      email_contratista: 'info@construccionesmodernas.es'
    },
    promotor: {
      nom_promotor: 'Promociones Urbanas S.A.',
      cif_promotor: 'A87654321',
      dir_promotor: 'Calle del Comercio 78',
      localidad_promotor: 'Madrid',
      cp_promotor: '28003',
      telf_promotor: '916543210',
      email_promotor: 'contacto@promocionesurbanas.com'
    },
    createdAt: new Date().toLocaleDateString('es-ES')
  }
}

/**
 * Sanitize template content for safe rendering
 * @param content - Template content to sanitize
 * @returns Sanitized content
 */
export function sanitizeTemplateContent(content: string): string {
  if (!content) return ''

  // Basic HTML sanitization for markdown content
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
}

/**
 * Format currency values for display
 * @param value - Numeric value
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return String(value)

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(num)
}

/**
 * Format number values for display
 * @param value - Numeric value
 * @returns Formatted number string
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return String(value)

  return new Intl.NumberFormat('es-ES').format(num)
}
