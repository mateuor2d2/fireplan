<template>
  <div
    v-if="shouldShowError"
    class="text-red-600 dark:text-red-400 text-sm mt-1"
  >
    {{ errorMessage }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { safeFieldAccess } from '~/composables/useErrorHandler'

interface Props {
  field?: any
  error?: string
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  field: undefined,
  error: '',
  show: false
})

const shouldShowError = computed(() => {
  if (props.show && props.error) {
    return true
  }

  if (props.field) {
    return safeFieldAccess(props.field, 'error', false)
  }

  return false
})

const errorMessage = computed(() => {
  if (props.error) {
    return props.error
  }

  if (props.field) {
    return safeFieldAccess(props.field, 'error', '')
  }

  return ''
})
</script>
