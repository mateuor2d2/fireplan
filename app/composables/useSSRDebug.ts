// composables/useSSRDebug.ts
/**
 * SSR Debugging utilities for tracking component rendering
 */
export function useSSRDebug(componentName: string) {
  if (import.meta.server) {
    console.log(`[SSR] Rendering component: ${componentName}`)
  }

  const logSlot = (slotName: string, hasContent: boolean) => {
    if (import.meta.server) {
      console.log(`[SSR] ${componentName} slot "${slotName}": ${hasContent ? 'HAS CONTENT' : 'EMPTY OR NULL'}`)
    }
  }

  const logError = (error: any, context: string) => {
    if (import.meta.server) {
      console.error(`[SSR] ${componentName} error in "${context}":`, error)
      console.error(`[SSR] Component state:`, {
        componentName,
        timestamp: new Date().toISOString()
      })
    }
  }

  return {
    logSlot,
    logError
  }
}

/**
 * Wraps a slot with null checks and logging
 */
export function safeSlot<T>(slot: (() => T) | undefined, fallback: T, context: string): T {
  try {
    if (import.meta.server) {
      console.log(`[SSR] Rendering slot in context: ${context}`)
    }

    if (!slot) {
      if (import.meta.server) {
        console.warn(`[SSR] Slot is undefined in context: ${context}`)
      }
      return fallback
    }

    const result = slot()
    if (import.meta.server) {
      console.log(`[SSR] Slot result in context "${context}":`, result ? 'HAS VALUE' : 'NULL/UNDEFINED')
    }

    return result ?? fallback
  } catch (error) {
    if (import.meta.server) {
      console.error(`[SSR] Slot error in context "${context}":`, error)
    }
    return fallback
  }
}
