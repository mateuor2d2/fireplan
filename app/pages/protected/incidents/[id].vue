<script setup lang="ts">
definePageMeta({ layout: 'app' })
const route = useRoute()
const toast = useToast()
const incident = ref(null)
const center = ref(null)
const editing = ref(false)
const saving = ref(false)
const form = reactive({ title: '', type: 'real', category: '', severity: 'leve', status: 'open' })
onMounted(async () => {
  const id = route.params.id
  try {
    const res = await $fetch(`/api/v1/incidents/${id}`) as any
    incident.value = res.data
    if (incident.value?.centerId) {
      const c = await $fetch(`/api/v1/centers/${incident.value.centerId}`) as any
      center.value = c.data
    }
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
})
function startEdit() {
  editing.value = true
  Object.assign(form, {
    title: incident.value?.title || '', type: incident.value?.type || 'real',
    category: incident.value?.category || '', severity: incident.value?.severity || 'leve',
    status: incident.value?.status || 'open'
  })
}
async function save() {
  saving.value = true
  try {
    await $fetch(`/api/v1/incidents/${route.params.id}`, {
      method: 'PATCH',
      body: { title: form.title, type: form.type, category: form.category, severity: form.severity, status: form.status }
    })
    toast.add({ title: 'Incidente actualizado', color: 'success' })
    editing.value = false
    const res = await $fetch(`/api/v1/incidents/${route.params.id}`) as any
    incident.value = res.data
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}
async function deleteIncident() {
  if (!confirm('Eliminar este incidente permanentemente?')) return
  try {
    await $fetch(`/api/v1/incidents/${route.params.id}`, { method: 'DELETE' })
    toast.add({ title: 'Incidente eliminado', color: 'success' })
    await navigateTo('/protected/incidents')
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>

<template>
  <div class="p-6">
    <UButton icon="i-heroicons-arrow-left" variant="ghost" @click="$router.back()" class="mb-4">Volver</UButton>
    <div v-if="incident">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-bold">{{ incident.title || 'Sin titulo' }}</h1>
          <div class="flex gap-2 mt-1">
            <UBadge :color="incident.severity === 'critico' ? 'red' : incident.severity === 'grave' ? 'orange' : incident.severity === 'moderado' ? 'yellow' : 'green'">{{ incident.severity }}</UBadge>
            <UBadge :color="incident.status === 'open' ? 'red' : incident.status === 'in_progress' ? 'yellow' : 'green'">{{ incident.status }}</UBadge>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton size="sm" icon="i-heroicons-pencil" color="warning" @click="startEdit">Editar</UButton>
          <UButton size="sm" icon="i-heroicons-trash" color="error" variant="ghost" @click="deleteIncident">Eliminar</UButton>
        </div>
      </div>
      <div v-if="editing" class="mb-4">
        <UCard>
          <template #header><span class="font-semibold">Editar Incidente</span></template>
          <div class="space-y-3">
            <UInput v-model="form.title" placeholder="Titulo" />
            <USelect v-model="form.type" :items="['real','simulacro','prueba']" />
            <UInput v-model="form.category" placeholder="Categoria" />
            <USelect v-model="form.severity" :items="['leve','moderado','grave','critico']" />
            <USelect v-model="form.status" :items="['open','in_progress','resolved','closed']" />
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
          <p><strong>Codigo:</strong> {{ incident.code || 'N/A' }}</p>
          <p><strong>Tipo:</strong> {{ incident.type }}</p>
          <p><strong>Categoria:</strong> {{ incident.category || 'N/A' }}</p>
          <p><strong>Centro:</strong> {{ center?.name || incident.centerId || 'N/A' }}</p>
        </UCard>
        <UCard>
          <template #header><span class="font-semibold">Ubicacion y Tiempos</span></template>
          <p><strong>Zona:</strong> {{ incident.location?.zone || 'N/A' }}</p>
          <p><strong>Detectado:</strong> {{ incident.detectedAt ? new Date(incident.detectedAt).toLocaleString() : 'N/A' }}</p>
          <p><strong>Iniciado:</strong> {{ incident.startedAt ? new Date(incident.startedAt).toLocaleString() : 'N/A' }}</p>
        </UCard>
      </div>
    </div>
    <div v-else class="text-center py-10"><UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto" /></div>
  </div>
</template>
