<script setup lang="ts">
definePageMeta({ layout: 'app' })
const route = useRoute()
const toast = useToast()
const simulacro = ref(null)
const center = ref(null)
const editing = ref(false)
const saving = ref(false)
const form = reactive({ tipo: '', objetivo: '', fechaProgramada: '', estado: 'programado' })
onMounted(async () => {
  const id = route.params.id
  try {
    const res = await $fetch(`/api/v1/simulacros/${id}`) as any
    simulacro.value = res.data
    if (simulacro.value?.centerId) {
      const c = await $fetch(`/api/v1/centers/${simulacro.value.centerId}`) as any
      center.value = c.data
    }
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
})
function startEdit() {
  editing.value = true
  Object.assign(form, {
    tipo: simulacro.value?.tipo || '', objetivo: simulacro.value?.objetivo || '',
    fechaProgramada: simulacro.value?.fechaProgramada ? new Date(simulacro.value.fechaProgramada).toISOString().slice(0,16) : '',
    estado: simulacro.value?.estado || 'programado'
  })
}
async function save() {
  saving.value = true
  try {
    await $fetch(`/api/v1/simulacros/${route.params.id}`, {
      method: 'PATCH',
      body: { tipo: form.tipo, objetivo: form.objetivo, fechaProgramada: form.fechaProgramada ? new Date(form.fechaProgramada) : undefined, estado: form.estado }
    })
    toast.add({ title: 'Simulacro actualizado', color: 'success' })
    editing.value = false
    const res = await $fetch(`/api/v1/simulacros/${route.params.id}`) as any
    simulacro.value = res.data
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}
async function deleteSimulacro() {
  if (!confirm('Eliminar este simulacro permanentemente?')) return
  try {
    await $fetch(`/api/v1/simulacros/${route.params.id}`, { method: 'DELETE' })
    toast.add({ title: 'Simulacro eliminado', color: 'success' })
    await navigateTo('/protected/simulacros')
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>

<template>
  <div class="p-6">
    <UButton icon="i-heroicons-arrow-left" variant="ghost" @click="$router.back()" class="mb-4">Volver</UButton>
    <div v-if="simulacro">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-bold">{{ simulacro.tipo || 'Simulacro' }}</h1>
          <UBadge :color="simulacro.estado === 'completado' ? 'green' : simulacro.estado === 'en_curso' ? 'yellow' : 'blue'" class="mt-1">{{ simulacro.estado }}</UBadge>
        </div>
        <div class="flex gap-2">
          <UButton size="sm" icon="i-heroicons-pencil" color="warning" @click="startEdit">Editar</UButton>
          <UButton size="sm" icon="i-heroicons-trash" color="error" variant="ghost" @click="deleteSimulacro">Eliminar</UButton>
        </div>
      </div>
      <div v-if="editing" class="mb-4">
        <UCard>
          <template #header><span class="font-semibold">Editar Simulacro</span></template>
          <div class="space-y-3">
            <UInput v-model="form.tipo" placeholder="Tipo" />
            <UInput v-model="form.objetivo" placeholder="Objetivo" />
            <UInput v-model="form.fechaProgramada" type="datetime-local" />
            <USelect v-model="form.estado" :options="['programado','en_curso','completado','cancelado']" />
          </div>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton variant="outline" @click="editing = false">Cancelar</UButton>
              <UButton color="primary" :loading="saving" @click="save">Guardar</UButton>
            </div>
          </template>
        </UCard>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard>
          <template #header><span class="font-semibold">Informacion</span></template>
          <p><strong>Objetivo:</strong> {{ simulacro.objetivo || 'N/A' }}</p>
          <p><strong>Centro:</strong> {{ center?.name || simulacro.centerId || 'N/A' }}</p>
          <p><strong>Fecha programada:</strong> {{ simulacro.fechaProgramada ? new Date(simulacro.fechaProgramada).toLocaleString() : 'N/A' }}</p>
        </UCard>
        <UCard>
          <template #header><span class="font-semibold">Resultados</span></template>
          <p><strong>Participantes:</strong> {{ simulacro.participantes || 'N/A' }}</p>
          <p><strong>Duracion:</strong> {{ simulacro.duracionReal ? simulacro.duracionReal + ' min' : 'N/A' }}</p>
          <p><strong>Observaciones:</strong> {{ simulacro.observaciones || 'N/A' }}</p>
        </UCard>
      </div>
    </div>
    <div v-else class="text-center py-10"><UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto" /></div>
  </div>
</template>
