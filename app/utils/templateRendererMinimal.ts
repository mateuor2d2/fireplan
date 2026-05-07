/**
 * Minimal template renderer that handles basic variable substitution
 * and some essential helper patterns without full Handlebars compilation
 * @param template - Template string with variables in {{variable}} format
 * @param data - Data object for variable substitution
 * @returns Rendered template
 */
export function renderTemplateMinimal(template: string, data: Record<string, any>): string {
  if (!template) return ''

  try {
    // Create a deep copy of data to avoid potential issues
    const templateData = JSON.parse(JSON.stringify(data))

    // Simple string replacement for template variables
    let result = template

    // Handle basic helper patterns that are commonly used

    // Handle {{#if (eq var1 var2)}}...{{/if}} patterns
    result = result.replace(/{{#if\s*\(\s*eq\s+([^}]+)\s+([^}]+)\s*\)}}(.*?){{\/if}}/gs, (match, var1, var2, content) => {
      const val1 = getNestedValue(templateData, var1.trim())
      const val2 = getNestedValue(templateData, var2.trim())
      return val1 == val2 ? content : ''
    })

    // Handle {{#if (ne var1 var2)}}...{{/if}} patterns
    result = result.replace(/{{#if\s*\(\s*ne\s+([^}]+)\s+([^}]+)\s*\)}}(.*?){{\/if}}/gs, (match, var1, var2, content) => {
      const val1 = getNestedValue(templateData, var1.trim())
      const val2 = getNestedValue(templateData, var2.trim())
      return val1 != val2 ? content : ''
    })

    // Handle {{#if (or var1 var2)}}...{{/if}} patterns
    result = result.replace(/{{#if\s*\(\s*or\s+([^}]+)\s+([^}]+)\s*\)}}(.*?){{\/if}}/gs, (match, var1, var2, content) => {
      const val1 = getNestedValue(templateData, var1.trim())
      const val2 = getNestedValue(templateData, var2.trim())
      return (val1 || val2) ? content : ''
    })

    // Handle {{#unless (eq var1 var2)}}...{{/unless}} patterns
    result = result.replace(/{{#unless\s*\(\s*eq\s+([^}]+)\s+([^}]+)\s*\)}}(.*?){{\/unless}}/gs, (match, var1, var2, content) => {
      const val1 = getNestedValue(templateData, var1.trim())
      const val2 = getNestedValue(templateData, var2.trim())
      return val1 != val2 ? content : ''
    })

    // Replace all {{variable}} patterns with corresponding data values
    // IMPORTANT: Exclude block helpers ({{#if}}, {{/if}}, etc.) by requiring first char to not be #, /, or }
    result = result.replace(/{{\s*([^#/}][^}]*)\s*}}/g, (match, variable) => {
      // Handle special case for evaluaGP helper
      if (variable.startsWith('evaluaGP ')) {
        // Extract parameters: evaluaGP value percentage
        const parts = variable.split(' ')
        if (parts.length >= 3) {
          const valueKey = parts[1]
          const percentageKey = parts[2]

          // Get values from data
          const value = templateData[valueKey]
          const percentage = templateData[percentageKey]

          // If both values exist and are numbers, evaluate
          if (typeof value === 'number' && typeof percentage === 'number') {
            return value >= percentage ? 'Sí' : 'No'
          }
        }
        // If we can't evaluate, return empty string
        return ''
      }

      // Handle nested properties like {{contratista.nom_contratista}}
      const keys = variable.split('.')
      let value = templateData

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key]
        } else {
          // Return the original placeholder if not found
          return match
        }
      }

      // Convert to string if needed
      return value !== null && value !== undefined ? String(value) : ''
    })

    return result
  } catch (error) {
    console.error('Minimal template rendering error:', error)
    return `Error: ${(error as Error).message}\n\nTemplate:\n${template}`
  }
}

/**
 * Helper function to get nested values from data object
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return undefined
    }
  }

  return value
}
