<script setup lang="ts">
import { useHelp } from '~/composables/useHelp'

const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const model = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const { help } = useHelp()
</script>

<template>
  <USlideover
    :open="model"
    side="right"
    :ui="{ content: 'w-full max-w-md' }"
    @update:open="model = $event"
  >
    <template #header="{ close }">
      <div class="flex-1 min-w-0">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ help?.title || 'Ayuda' }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ help?.location || '' }}
        </p>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        icon="i-heroicons-x-mark-20-solid"
        class="-my-1"
        aria-label="Cerrar"
        @click="close"
      />
    </template>

    <template #body="{ close }">
      <div class="space-y-6">
        <template v-if="help">
          <!-- Description -->
          <UAlert
            v-if="help.description"
            color="primary"
            variant="soft"
            icon="i-heroicons-information-circle"
            :description="help.description"
          />

          <!-- Tips -->
          <div v-if="help.tips?.length">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-yellow-500" />
              Consejos útiles
            </h3>
            <ul class="space-y-3">
              <li
                v-for="(tip, idx) in help.tips"
                :key="idx"
                class="flex gap-3 text-sm text-gray-600 dark:text-gray-300"
              >
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <span class="leading-relaxed">{{ tip }}</span>
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div v-if="help.actions?.length">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-primary-500" />
              Acciones disponibles
            </h3>
            <div class="grid gap-2">
              <div
                v-for="(action, idx) in help.actions"
                :key="idx"
                class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
              >
                <UIcon
                  v-if="action.icon"
                  :name="action.icon"
                  class="w-5 h-5 text-gray-400"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ action.label }}
                  </p>
                  <p
                    v-if="action.description"
                    class="text-xs text-gray-500"
                  >
                    {{ action.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="text-center text-gray-500 py-8">
          <UIcon name="i-heroicons-question-mark-circle" class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay ayuda disponible para esta página.</p>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <p class="text-xs text-center text-gray-500">
        ¿Necesitas más ayuda? Contacta con soporte desde la página de
        <ULink to="/support" class="text-primary-600 hover:underline" @click="close">
          soporte
        </ULink>.
      </p>
    </template>
  </USlideover>
</template>
