<script setup lang="ts">
definePageMeta({ layout: 'app' })
const route = useRoute()
const toast = useToast()
const worker = ref(null)
const centers = ref([])
const editing = ref(false)
const saving = ref(false)
const form = reactive({ name: '', email: '', phone: '', emergencyRole: '', status: 'active' })
onMounted(async () => {
  const id = route.params.id
  try {
    const res = await $fetch(`/api/v1/workers/${id}`) as any
    worker.value = res.data
    const c = await $fetch('/api/v1/centers') as any
    centers.value = c.data || []
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
})
function startEdit() {
  editing.value = true
  Object.assign(form, {
    name: worker.value?.name || '', email: worker.value?.email || '',
    phone: worker.value?.phone || '', emergencyRole: worker.value?.emergencyRole || '',
    status: worker.value?.status || 'active'
  })
}
async function save() {
  saving.value = true
  try {
    await $fetch(`/api/v1/workers/${route.params.id}`, {
      method: 'PATCH',
      body: { name: form.name, email: form.email, phone: form.phone, emergencyRole: form.emergencyRole, status: form.status }
    })
    toast.add({ title: 'Worker actualizado', color: 'success' })
    editing.value = false
    const res = await $fetch(`/api/v1/workers/${route.params.id}`) as any
    worker.value = res.data
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}
async function deleteWorker() {
  if (!confirm('Eliminar este trabajador permanentemente?')) return
  try {
    await $fetch(`/api/v1/workers/${route.params.id}`, { method: 'DELETE' })
    toast.add({ title: 'Worker eliminado', color: 'success' })
    await navigateTo('/protected/workers')
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>

<template>
  <div class="p-6">
    <UButton icon="i-heroicons-arrow-left" variant="ghost" @click="$router.back()" class="mb-4">Volver</UButton>
    <div v-if="worker">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-bold">{{ worker.name || 'Sin nombre' }}</h1>
          <UBadge :color="worker.status === 'active' ? 'green' : 'gray'" class="mt-1">{{ worker.status }}</UBadge>
        </div>
        <div class="flex gap-2">
          <UButton size="sm" icon="i-heroicons-pencil" color="warning" @click="startEdit">Editar</UButton>
          <UButton size="sm" icon="i-heroicons-trash" color="error" variant="ghost" @click="deleteWorker">Eliminar</UButton>
        </div>
      </div>
      <div v-if="editing" class="mb-4">
        <UCard>
          <template #header><span class="font-semibold">Editar Trabajador</span></template>
          <div class="space-y-3">
            <UInput v-model="form.name" placeholder="Nombre" />
            <UInput v-model="form.email" placeholder="Email" />
            <UInput v-model="form.phone" placeholder="Telefono" />
            <UInput v-model="form.emergencyRole" placeholder="Rol de emergencia" />
            <USelect v-model="form.status" :options="['active','inactive']" />
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
          <template #header><span class="font-semibold">Informacion Personal</span></template>
          <p><strong>Email:</strong> {{ worker.email || 'N/A' }}</p>
          <p><strong>Telefono:</strong> {{ worker.phone || 'N/A' }}</p>
          <p><strong>Rol de emergencia:</strong> {{ worker.emergencyRole || 'N/A' }}</p>
        </UCard>
        <UCard>
          <template #header><span class="font-semibold">Centros Asignados</span></template>
          <div v-if="worker.centers?.length" class="space-y-1">
            <p v-for="wc in worker.centers" :key="wc.centerId">{{ centers.find(c => c._id === wc.centerId)?.name || wc.centerId }} — {{ wc.role }}</p>
          </div>
          <p v-else class="text-gray-500">Sin centros asignados</p>
        </UCard>
      </div>
    </div>
    <div v-else class="text-center py-10"><UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto" /></div>
  </div>
</template>
