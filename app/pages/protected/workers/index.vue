<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Trabajadores</h1>
        <p class="text-gray-500">Gestiona el personal de emergencia</p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" @click="modalOpen = true">Nuevo Trabajador</UButton>
    </div>
    <div v-if="loading" class="text-center py-8"><UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" /></div>
    <div v-else-if="workers.length === 0" class="text-gray-500 py-8 text-center">No hay trabajadores registrados.</div>
    <div v-else class="space-y-4">
      <UCard v-for="worker in workers" :key="worker._id">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ worker.name }}</span>
              <UBadge :color="getRoleColor(worker.emergencyRole)" size="sm">{{ worker.emergencyRole }}</UBadge>
            </div>
            <span class="text-sm text-gray-500">{{ worker.email }}</span>
          </div>
        </template>
        <div class="text-sm space-y-1">
          <p v-if="worker.phone"><strong>Teléfono:</strong> {{ worker.phone }}</p>
          <p v-if="worker.role"><strong>Rol:</strong> {{ worker.role }}</p>
          <p v-if="worker.centers?.length"><strong>Centros:</strong> {{ worker.centers.map((c: any) => c.centerId?.name || c.centerId).join(', ') }}</p>
        </div>
        <template #footer>
          <div class="flex gap-2">
            <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" color="warning" @click="editWorker(worker)">Editar</UButton>
            <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="error" @click="deleteWorker(worker._id)">Eliminar</UButton>
          </div>
        </template>
      </UCard>
    </div>
    <!-- Create/Edit Modal -->
    <UModal v-model:open="modalOpen">
      <template #header><h3 class="text-lg font-semibold">{{ editing ? 'Editar' : 'Nuevo' }} Trabajador</h3></template>
      <template #body>
        <div class="space-y-3">
          <UInput v-model="form.name" placeholder="Nombre completo" />
          <UInput v-model="form.email" placeholder="Email" type="email" />
          <UInput v-model="form.phone" placeholder="Teléfono" />
          <USelectMenu v-model="form.emergencyRole" :items="roleOptions" value-key="value" label-key="label" placeholder="Rol de emergencia" />
          <USelectMenu v-model="form.role" :items="userRoleOptions" value-key="value" label-key="label" placeholder="Rol de usuario" />
          <USelectMenu v-if="centerOptions.length" v-model="form.centerIds" :items="centerOptions" value-key="value" label-key="label" multiple placeholder="Centros asignados" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="modalOpen = false">Cancelar</UButton>
          <UButton color="primary" :loading="saving" @click="saveWorker">{{ editing ? 'Actualizar' : 'Guardar' }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'app' })
const toast = useToast()
const store = useFireplanStore()
const { centers } = storeToRefs(store)
const workers = ref<any[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const editing = ref(false)
const saving = ref(false)
const currentId = ref('')

const roleOptions = [
  { label: 'Jefe de Equipo', value: 'jefe_equipo' },
  { label: 'Brigadista', value: 'brigadista' },
  { label: 'Coordinador', value: 'coordinador' },
  { label: 'Primeros Auxilios', value: 'primeros_auxilios' },
  { label: 'Evacuación', value: 'evacuacion' },
  { label: 'Extinción', value: 'extincion' },
  { label: 'Comunicaciones', value: 'comunicaciones' },
  { label: 'Otro', value: 'otro' }
]

const userRoleOptions = [
  { label: 'Usuario', value: 'user' },
  { label: 'Centro Admin', value: 'centroadmin' }
]

const centerOptions = computed(() => centers.value.map(c => ({ label: c.name, value: c._id })))

const form = reactive({
  name: '',
  email: '',
  phone: '',
  emergencyRole: '',
  role: 'user',
  centerIds: [] as string[]
})

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    jefe_equipo: 'primary', brigadista: 'success', coordinador: 'warning',
    primeros_auxilios: 'error', evacuacion: 'info', extincion: 'error',
    comunicaciones: 'primary', otro: 'neutral'
  }
  return colors[role] || 'neutral'
}

async function fetchWorkers() {
  loading.value = true
  try {
    const res = await $fetch('/api/v1/workers') as any
    workers.value = res.data || []
  } catch (e) { toast.add({ title: 'Error', description: 'No se pudieron cargar los trabajadores', color: 'error' }) }
  finally { loading.value = false }
}

function editWorker(worker: any) {
  editing.value = true
  currentId.value = worker._id
  Object.assign(form, {
    name: worker.name || '',
    email: worker.email || '',
    phone: worker.phone || '',
    emergencyRole: worker.emergencyRole || '',
    role: worker.role || 'user',
    centerIds: worker.centers?.map((c: any) => typeof c.centerId === 'string' ? c.centerId : c.centerId?._id) || []
  })
  modalOpen.value = true
}

async function saveWorker() {
  saving.value = true
  try {
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      emergencyRole: form.emergencyRole,
      role: form.role,
      centers: form.centerIds.map((id: string) => ({ centerId: id }))
    }
    if (editing.value) {
      await $fetch(`/api/v1/workers/${currentId.value}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Trabajador actualizado', color: 'success' })
    } else {
      await $fetch('/api/v1/workers', { method: 'POST', body: payload })
      toast.add({ title: 'Trabajador creado', color: 'success' })
    }
    modalOpen.value = false
    resetForm()
    await fetchWorkers()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}

async function deleteWorker(id: string) {
  if (!confirm('¿Eliminar este trabajador?')) return
  try {
    await $fetch(`/api/v1/workers/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Trabajador eliminado', color: 'success' })
    await fetchWorkers()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}

function resetForm() {
  Object.assign(form, { name: '', email: '', phone: '', emergencyRole: '', role: 'user', centerIds: [] })
  editing.value = false
  currentId.value = ''
}

onMounted(() => {
  store.fetchCenters()
  fetchWorkers()
})
</script>
