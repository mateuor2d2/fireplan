import Handlebars from 'handlebars'
import { evaluaGP, formatCurrencyLocale, formatNumberLocale } from './templateHelpers'

/**
 * Simplified template rendering function that focuses on basic variable substitution
 * with essential helpers that templates need to function properly
 * @param template - Template string with variables
 * @param data - Data object for variable substitution
 * @returns Rendered template
 */
export function renderTemplateSimple(template: string, data: Record<string, any>): string {
  if (!template) return ''

  try {
    // Register essential helpers that templates absolutely need
    // These are the minimum helpers required for basic template functionality

    // Comparison helpers (critical for conditionals)
    if (!Handlebars.helpers['eq']) {
      Handlebars.registerHelper('eq', function (arg1, arg2) {
        return arg1 == arg2
      })
    }

    if (!Handlebars.helpers['ne']) {
      Handlebars.registerHelper('ne', function (arg1, arg2) {
        return arg1 != arg2
      })
    }

    if (!Handlebars.helpers['gt']) {
      Handlebars.registerHelper('gt', function (arg1, arg2) {
        return arg1 > arg2
      })
    }

    if (!Handlebars.helpers['lt']) {
      Handlebars.registerHelper('lt', function (arg1, arg2) {
        return arg1 < arg2
      })
    }

    if (!Handlebars.helpers['gte']) {
      Handlebars.registerHelper('gte', function (arg1, arg2) {
        return arg1 >= arg2
      })
    }

    if (!Handlebars.helpers['lte']) {
      Handlebars.registerHelper('lte', function (arg1, arg2) {
        return arg1 <= arg2
      })
    }

    // Logic helpers (critical for complex conditionals)
    if (!Handlebars.helpers['or']) {
      Handlebars.registerHelper('or', function (...args) {
        const operands = args.slice(0, -1) // Remove options object
        for (const operand of operands) {
          if (operand) return operand
        }
        return false
      })
    }

    // Array helpers (critical for loops)
    if (!Handlebars.helpers['each']) {
      Handlebars.registerHelper('each', function (context, options) {
        if (!context || !Array.isArray(context)) return ''
        let result = ''
        for (let i = 0; i < context.length; i++) {
          result += options.fn(context[i], { data: { index: i, first: i === 0, last: i === context.length - 1 } })
        }
        return result
      })
    }

    // Basic conditional helpers
    if (!Handlebars.helpers['if']) {
      Handlebars.registerHelper('if', function (condition, options) {
        if (condition) {
          return options.fn(this)
        } else {
          return options.inverse(this)
        }
      })
    }

    if (!Handlebars.helpers['unless']) {
      Handlebars.registerHelper('unless', function (condition, options) {
        if (!condition) {
          return options.fn(this)
        } else {
          return options.inverse(this)
        }
      })
    }

    // Utility helpers
    if (!Handlebars.helpers['length']) {
      Handlebars.registerHelper('length', function (array) {
        return array ? array.length : 0
      })
    }

    // Formatting helpers (commonly used)
    if (!Handlebars.helpers['evaluaGP']) {
      Handlebars.registerHelper('evaluaGP', evaluaGP)
    }

    if (!Handlebars.helpers['formatCurrency']) {
      Handlebars.registerHelper('formatCurrency', formatCurrencyLocale)
    }

    if (!Handlebars.helpers['formatNumber']) {
      Handlebars.registerHelper('formatNumber', formatNumberLocale)
    }

    // Create a deep copy of data to avoid potential issues
    const templateData = JSON.parse(JSON.stringify(data))

    // Compile with Handlebars with essential helpers registered
    const compiledTemplate = Handlebars.compile(template)
    const result = compiledTemplate(templateData)

    return result
  } catch (error) {
    console.error('Simple template rendering error:', error)
    return `Error: ${(error as Error).message}\n\nTemplate:\n${template}`
  }
}

export default { renderTemplateSimple }
