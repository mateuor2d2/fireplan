import { computed } from 'vue'
import { useConceptoStore, type Concepto } from '@/stores/conceptos'
import { schemaConcepto } from '@/schemas/conceptos'

export function useConceptoFormField<K extends keyof Concepto>(fieldName: K) {
  const store = useConceptoStore()
  const error = ref('')

  const fieldValue = computed({
    get: () => store.conceptoActual[fieldName],
    set: (value) => {
      // Create a temporary object with the updated value
      const updatedConcepto = { ...store.conceptoActual, [fieldName]: value }

      // Validate using Zod
      const result = schemaConcepto.safeParse(updatedConcepto)

      if (result.success) {
        error.value = '' // Clear error if validation succeeds
        store.updateConceptoField(fieldName, value) // Update the store
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
