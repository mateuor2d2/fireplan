import { ref } from 'vue'

/**
 * Composable for handling errors in a consistent way across the application
 * This ensures that errors never break page loading and are displayed appropriately
 */
export function useErrorHandler() {
  const errors = ref<Record<string, string>>({})
  const generalError = ref<string>('')
  const isLoading = ref(false)

  /**
   * Safely get an error for a field, always returns a string
   */
  function getFieldError(fieldName: string): string {
    return errors.value[fieldName] || ''
  }

  /**
   * Set an error for a specific field
   */
  function setFieldError(fieldName: string, error: string) {
    errors.value[fieldName] = error
  }

  /**
   * Clear error for a specific field
   */
  function clearFieldError(fieldName: string) {
    delete errors.value[fieldName]
  }

  /**
   * Clear all errors
   */
  function clearAllErrors() {
    errors.value = {}
    generalError.value = ''
  }

  /**
   * Set a general error message
   */
  function setGeneralError(error: string) {
    generalError.value = error
  }

  /**
   * Handle API errors in a consistent way
   */
  function handleApiError(error: any, context = 'Operation') {
    console.error(`${context} error:`, error)
    const message
      = error?.message || error?.data?.message || `${context} failed`
    setGeneralError(message)
  }

  /**
   * Safely execute an async operation with error handling
   */
  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    context = 'Operation'
  ): Promise<T | null> {
    try {
      isLoading.value = true
      clearAllErrors()
      return await operation()
    } catch (error) {
      handleApiError(error, context)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Check if a field has an error (safe check)
   */
  function hasFieldError(fieldName: string): boolean {
    return Boolean(errors.value[fieldName])
  }

  /**
   * Check if there are any errors
   */
  function hasErrors(): boolean {
    return Object.keys(errors.value).length > 0 || Boolean(generalError.value)
  }

  return {
    errors: readonly(errors),
    generalError: readonly(generalError),
    isLoading: readonly(isLoading),
    getFieldError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setGeneralError,
    handleApiError,
    withErrorHandling,
    hasFieldError,
    hasErrors
  }
}

/**
 * Safe access to field properties - prevents runtime errors
 */
export function safeFieldAccess(
  field: any,
  property: string,
  defaultValue: any = ''
) {
  try {
    if (field && typeof field === 'object' && property in field) {
      return field[property] ?? defaultValue
    }
    return defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Safe error display component props
 */
export function getSafeErrorProps(field: any) {
  return {
    hasError: safeFieldAccess(field, 'error', false),
    errorMessage: safeFieldAccess(field, 'error', ''),
    isValid: !safeFieldAccess(field, 'error', false)
  }
}
