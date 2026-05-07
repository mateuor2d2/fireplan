import Handlebars from 'handlebars'

/**
 * Cleans and validates a Handlebars template string
 * @param template - The template string to clean
 * @returns Cleaned template string
 */
export function cleanTemplate(template: string): string {
  if (!template) return ''

  // Remove any problematic characters or sequences
  return template
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove any null bytes or other problematic characters
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
}

/**
 * Validates and fixes common Handlebars syntax issues
 * @param template - The template string to validate
 * @returns Validated template string
 */
export function validateAndFixTemplate(template: string): string {
  if (!template) return ''

  // Make a copy to work with
  let fixedTemplate = template

  // Fix common issues with helper syntax that might cause "options.fn is not a function"
  // This typically happens when helpers are used incorrectly in the template

  // Replace malformed block helpers that might be missing proper syntax
  fixedTemplate = fixedTemplate.replace(/{{#\s*if\s+([^}]+)}}/g, '{{#if $1}}')
  fixedTemplate = fixedTemplate.replace(/{{#\s*unless\s+([^}]+)}}/g, '{{#unless $1}}')
  fixedTemplate = fixedTemplate.replace(/{{#\s*each\s+([^}]+)}}/g, '{{#each $1}}')
  fixedTemplate = fixedTemplate.replace(/{{\/\s*if\s*}}/g, '{{/if}}')
  fixedTemplate = fixedTemplate.replace(/{{\/\s*unless\s*}}/g, '{{/unless}}')
  fixedTemplate = fixedTemplate.replace(/{{\/\s*each\s*}}/g, '{{/each}}')

  // Fix eq helper usage - make sure it's used as a block helper when appropriate
  fixedTemplate = fixedTemplate.replace(/{{#\s*eq\s+([^}]+)}}/g, '{{#eq $1}}')
  fixedTemplate = fixedTemplate.replace(/{{\/\s*eq\s*}}/g, '{{/eq}}')

  // Check for unmatched helpers
  const openHelpers = (fixedTemplate.match(/{{#/g) || []).length
  const closeHelpers = (fixedTemplate.match(/{{\//g) || []).length

  if (openHelpers !== closeHelpers) {
    console.warn(`Mismatched Handlebars helpers: ${openHelpers} open, ${closeHelpers} close`)
  }

  return fixedTemplate
}

/**
 * Attempts to identify and fix specific Handlebars helper issues
 * @param template - The template to analyze
 * @returns Fixed template
 */
export function fixHelperIssues(template: string): string {
  if (!template) return ''

  let fixedTemplate = template

  // Look for patterns that might cause "options.fn is not a function"
  // This typically happens when helpers are used incorrectly

  // Pattern: {{#helper}} without proper closing or with incorrect syntax
  const helperPattern = /{{#\s*(\w+)\s+([^}]+)}}/g
  fixedTemplate = fixedTemplate.replace(helperPattern, (match, helperName, params) => {
    // Make sure common helpers are used correctly
    if (['if', 'unless', 'each', 'eq', 'ne', 'gt', 'lt', 'gte', 'lte'].includes(helperName)) {
      return `{{#${helperName} ${params}}}`
    }
    return match
  })

  return fixedTemplate
}
