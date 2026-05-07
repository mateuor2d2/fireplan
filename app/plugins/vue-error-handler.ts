// plugins/vue-error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:error', (error) => {
    console.error('=== Nuxt SSR Error ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)

    // Try to extract component info
    if (error.stack) {
      const stackLines = error.stack.split('\n')
      console.error('=== Stack Trace ===')
      stackLines.forEach((line, i) => {
        console.error(`[${i}] ${line}`)
      })
    }
  })

  // Capture Vue rendering errors
  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    console.error('=== Vue Error Handler ===')
    console.error('Error:', err)
    console.error('Component Info:', info)
    console.error('Instance:', instance?.$options?.name || instance?.$?.type?.name || 'Unknown')

    if (instance) {
      console.error('Component data:', instance.$data)
      console.error('Component props:', instance.$props)
      console.error('Parent:', instance.$parent?.$options?.name || 'None')
    }
  }

  // Capture rendering warnings
  nuxtApp.vueApp.config.warnHandler = (msg, instance, trace) => {
    console.warn('=== Vue Warning ===')
    console.warn('Message:', msg)
    console.warn('Trace:', trace)
    if (instance) {
      console.warn('Component:', instance.$options?.name || 'Unknown')
    }
  }
})
