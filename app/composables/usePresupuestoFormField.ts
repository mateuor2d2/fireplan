import { computed } from 'vue'
import { usePresupuestosStore } from '@/stores/presupuestos'
import { SchemaConceptodePresupuesto } from '@/schemas/presupuestos'

export function usePresupuestoFormField<
  K extends keyof SchemaConceptodePresupuesto
>(fieldName: K) {
  const store = usePresupuestosStore()
  const error = ref('')

  const fieldValue = computed({
    get: () => store.conceptoActual[fieldName],
    set: (value) => {
      // Create a temporary object with the updated value
      const updatedConcepto = { ...store.conceptoActual, [fieldName]: value }

      // Validate using Zod
      const result = SchemaConceptodePresupuesto.safeParse(updatedConcepto)

      if (result.success) {
        error.value = '' // Clear error if validation succeeds
        store.updateConceptoPresupuestoField(fieldName, value) // Update the store
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
