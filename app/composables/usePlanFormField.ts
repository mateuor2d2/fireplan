import { computed } from 'vue'
import { usePlanesStore } from '@/stores/planes'
import { schemaAllForms } from '@/schemas/planes'

export function usePlanFormField<K extends keyof Plan>(fieldName: K) {
  const store = usePlanesStore()
  const error = ref('')

  const fieldValue = computed({
    get: () => store.planActual[fieldName],
    set: (value) => {
      // Create a temporary object with the updated value
      const updatedPlan = { ...store.planActual, [fieldName]: value }

      // Validate using Zod
      const result = schemaAllForms.safeParse(updatedPlan)

      if (result.success) {
        error.value = '' // Clear error if validation succeeds
        store.updatePlanField(fieldName, value) // Update the store
      } else {
        // Find the specific field error
        const fieldError = result.error.errors.find(
          err => err.path[0] === fieldName
        )
        error.value = fieldError ? fieldError.message : 'Validation error'
      }
    }
  })

  return { fieldValue, error }
}
