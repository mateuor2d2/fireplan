// Remove circular import - we'll implement the functions directly here if needed

/**
 * Helper function for evaluaGP - evaluates risk based on probability and severity
 * This is used in risk assessment tables for safety plans
 * @param gravedadId - Severity ID (1-4)
 * @param probabilidadId - Probability ID (1-4)
 * @param options - Handlebars options object
 * @returns Risk evaluation result (Bajo, Medio, Alto, Muy Alto)
 */
export function evaluaGP(gravedadId: any, probabilidadId: any, options?: any) {
  // Handle case where arguments are not provided properly
  if (arguments.length < 2) {
    return ''
  }

  // Convert to numbers if they're strings
  const gravedad = typeof gravedadId === 'string' ? parseInt(gravedadId) : gravedadId
  const probabilidad = typeof probabilidadId === 'string' ? parseInt(probabilidadId) : probabilidadId

  // Ensure we have proper parameters
  if (typeof gravedad !== 'number' || typeof probabilidad !== 'number' || isNaN(gravedad) || isNaN(probabilidad)) {
    return ''
  }

  // Risk matrix calculation based on Spanish safety standards
  // Gravedad: 1-4 (1 = Leve, 4 = Catastrófica)
  // Probabilidad: 1-4 (1 = Improbable, 4 = Muy Probable)
  const riesgo = gravedad * probabilidad

  // Determine risk level based on matrix
  let resultado = ''
  if (riesgo <= 4) {
    resultado = 'Bajo'
  } else if (riesgo <= 8) {
    resultado = 'Medio'
  } else if (riesgo <= 12) {
    resultado = 'Alto'
  } else {
    resultado = 'Muy Alto'
  }

  // If options object is provided (block helper usage)
  if (options && typeof options === 'object') {
    // Handle block helper usage
    if (typeof options.fn === 'function' && typeof options.inverse === 'function') {
      return resultado ? options.fn(this) : options.inverse(this)
    }
  }

  // For simple helper usage, return the risk level
  return resultado
}

/**
 * Helper function for formatCurrency with locale
 * @param value - The value to format
 * @param locale - The locale to use for formatting (optional)
 * @returns Formatted currency string
 */
export function formatCurrencyLocale(value: any, locale: string = 'es-ES') {
  // Handle case where value is not a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (typeof numValue !== 'number' || isNaN(numValue)) {
    return String(value)
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR'
  }).format(numValue)
}

/**
 * Helper function for formatNumber with locale
 * @param value - The value to format
 * @param locale - The locale to use for formatting (optional)
 * @returns Formatted number string
 */
export function formatNumberLocale(value: any, locale: string = 'es-ES') {
  // Handle case where value is not a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (typeof numValue !== 'number' || isNaN(numValue)) {
    return String(value)
  }

  return new Intl.NumberFormat(locale).format(numValue)
}
