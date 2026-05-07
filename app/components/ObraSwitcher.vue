<script setup lang="ts">
interface Obra {
  _id: string
  nom_obra: string
}

const emit = defineEmits<{
  (e: 'select', obraId: string): void
}>()

const obras = ref<Obra[]>([])
const selected = ref<string>('')

onMounted(async () => {
  try {
    const data = await $fetch<{ obras: Obra[] }>('/api/obras/my-obras')
    obras.value = data.obras || []
    if (obras.value.length > 0) {
      selected.value = obras.value[0]._id
      emit('select', selected.value)
    }
  } catch {
    // User may not have access yet
  }
})

const items = computed(() =>
  obras.value.map(o => ({ label: o.nom_obra, value: o._id }))
)

watch(selected, (val) => {
  if (val) emit('select', val)
})
</script>

<template>
  <USelect
    v-if="obras.length > 0"
    v-model="selected"
    :items="items"
    icon="i-lucide-building-2"
    placeholder="Seleccionar obra..."
    class="w-56"
  />
</template>
