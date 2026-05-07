import { ref, reactive } from 'vue'
import type { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

interface UseFormHandlerOptions<T extends z.ZodType<any, any>> {
  schema: T
  defaultValues: z.infer<T>
  onSubmit: (data: z.infer<T>) => Promise<void>
  onSuccess: () => void
  onError: (error: any) => void
}

export function useFormHandler<T extends z.ZodType<any, any>>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError
}: UseFormHandlerOptions<T>) {
  const form = ref()
  const state = reactive({ ...defaultValues })
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  const handleSubmit = async (event: FormSubmitEvent<z.infer<T>>) => {
    isSubmitting.value = true
    submitError.value = null
    try {
      await onSubmit(event.data)
      onSuccess()
    } catch (error) {
      onError(error)
      const errorMessage = (error instanceof Error) ? error.message : 'An unexpected error occurred.'
      submitError.value = errorMessage
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    state,
    isSubmitting,
    submitError,
    handleSubmit
  }
}
