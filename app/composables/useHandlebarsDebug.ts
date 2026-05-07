import Handlebars from 'handlebars'
import { evaluaGP } from '~/utils/templateHelpers'

export function debugHandlebarsRendering() {
  // Register helpers with defensive programming
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

  // Test with a simple template
  const testTemplate = 'Hello {{name}}, welcome to {{place}}!'
  const testData = { name: 'John', place: 'our website' }

  try {
    const compiled = Handlebars.compile(testTemplate)
    const result = compiled(testData)
    console.log('Handlebars test result:', result)
    return result
  } catch (error) {
    console.error('Handlebars test error:', error)
    return 'Error in Handlebars test'
  }
}

export function testTemplateWithHelpers() {
  // Register helpers with defensive programming
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

  // Register the evaluaGP helper for testing
  Handlebars.registerHelper('evaluaGP', evaluaGP)

  // Test with a template that uses helpers
  const testTemplate = '{{#eq name "John"}}Hello John!{{else}}Hello {{name}}!{{/eq}}'
  const testData = { name: 'John' }

  try {
    const compiled = Handlebars.compile(testTemplate)
    const result = compiled(testData)
    console.log('Handlebars helper test result:', result)
    return result
  } catch (error) {
    console.error('Handlebars helper test error:', error)
    return 'Error in Handlebars helper test'
  }
}

export function testEvaluaGPHelper() {
  // Register the evaluaGP helper
  Handlebars.registerHelper('evaluaGP', evaluaGP)

  // Test with a template that uses the evaluaGP helper
  const testTemplate = '{{evaluaGP value percentage}}'
  const testData = { value: 80, percentage: 75 }

  try {
    const compiled = Handlebars.compile(testTemplate)
    const result = compiled(testData)
    console.log('evaluaGP helper test result:', result)
    return result
  } catch (error) {
    console.error('evaluaGP helper test error:', error)
    return 'Error in evaluaGP helper test'
  }
}

export default { debugHandlebarsRendering, testTemplateWithHelpers, testEvaluaGPHelper }
