<script setup lang="ts">
import type { MiniConcepto } from '~/stores/conceptos'
import type { MiniPlan } from '~/stores/planes'

interface Props {
  item: MiniPlan | MiniConcepto | null
  tipo: 'planes' | 'conceptos'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: [string | null]
}>()

const newName = ref('')
const isLoading = ref(false)

const itemName = computed(() => {
  if (!props.item) return ''
  if (props.tipo === 'planes') {
    return (props.item as MiniPlan).nom_obra
  }
  return (props.item as MiniConcepto).nom_concepto
})

const defaultName = computed(() => {
  const original = itemName.value
  return original ? `Copia de ${original}` : ''
})

onMounted(() => {
  newName.value = defaultName.value
})

function handleConfirm() {
  if (!newName.value.trim()) return
  emit('close', newName.value.trim())
}
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close', null) }"
    title="Copiar"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-copy" class="w-5 h-5 text-primary-500" />
        <span>Copiar {{ tipo === 'planes' ? 'Plan' : 'Concepto' }}</span>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <UAlert
          color="info"
          icon="i-heroicons-information-circle"
          variant="soft"
          :description="`Se creará una copia de '${itemName}'. Puedes cambiar el nombre a continuación.`"
        />

        <div class="space-y-2">
          <label class="block text-sm font-medium">
            Nombre del {{ tipo === 'planes' ? 'plan' : 'concepto' }} copiado
          </label>
          <UInput
            v-model="newName"
            :placeholder="`Nombre del ${tipo === 'planes' ? 'plan' : 'concepto'}...`"
            class="w-full"
            autofocus
            @keyup.enter="handleConfirm"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          @click="() => emit('close', null)"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          :disabled="!newName.trim() || isLoading"
          :loading="isLoading"
          @click="handleConfirm"
        >
          <UIcon name="i-lucide-copy" class="w-4 h-4 mr-1" />
          Copiar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
