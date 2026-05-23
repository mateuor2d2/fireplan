<script setup lang="ts">
definePageMeta({ layout: 'app' })
const toast = useToast()
const tenants = ref<any[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const editing = ref(false)
const saving = ref(false)
const currentId = ref('')
const form = reactive({ name: '', slug: '', domain: '', status: 'active', plan: 'free' })
const columns = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'plan', header: 'Plan' },
  { accessorKey: 'createdAt', header: 'Creado' },
  { accessorKey: 'actions', header: 'Acciones' }
]
onMounted(() => fetchTenants())

async function fetchTenants() {
  loading.value = true
  try {
    const res = await $fetch('/api/v1/admin/tenants') as any
    tenants.value = res.data || []
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { loading.value = false }
}

function openCreate() {
  editing.value = false
  currentId.value = ''
  Object.assign(form, { name: '', slug: '', domain: '', status: 'active', plan: 'free' })
  modalOpen.value = true
}

function editTenant(row: any) {
  editing.value = true
  currentId.value = row._id
  Object.assign(form, {
    name: row.name || '', slug: row.slug || '', domain: row.domain || '',
    status: row.status || 'active', plan: row.plan || 'free'
  })
  modalOpen.value = true
}

async function saveTenant() {
  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/v1/admin/tenants/${currentId.value}`, {
        method: 'PATCH',
        body: { name: form.name, slug: form.slug, domain: form.domain, status: form.status, plan: form.plan }
      })
      toast.add({ title: 'Tenant actualizado', color: 'success' })
    } else {
      await $fetch('/api/v1/admin/tenants', {
        method: 'POST',
        body: { name: form.name, slug: form.slug, domain: form.domain, status: form.status, plan: form.plan }
      })
      toast.add({ title: 'Tenant creado', color: 'success' })
    }
    modalOpen.value = false
    await fetchTenants()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}

async function deleteTenant(id: string) {
  if (!confirm('Eliminar este tenant?')) return
  try {
    await $fetch(`/api/v1/admin/tenants/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Tenant eliminado', color: 'success' })
    await fetchTenants()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Administracion — Tenants</h1>
      <UButton icon="i-heroicons-plus" @click="openCreate">Nuevo Tenant</UButton>
    </div>
    <UTable :rows="tenants" :columns="columns">
      <template #status-cell="{ row }">
        <UBadge :color="row.status === 'active' ? 'green' : row.status === 'suspended' ? 'red' : 'gray'">{{ row.status }}</UBadge>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-2">
          <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" color="warning" @click="editTenant(row)" />
          <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="error" @click="deleteTenant(row._id)" />
        </div>
      </template>
    </UTable>
    <UModal v-model:open="modalOpen">
      <template #header><h3 class="text-lg font-semibold">{{ editing ? 'Editar' : 'Nuevo' }} Tenant</h3></template>
      <template #body>
        <div class="space-y-3">
          <UInput v-model="form.name" placeholder="Nombre" required />
          <UInput v-model="form.slug" placeholder="Slug" required />
          <UInput v-model="form.domain" placeholder="Dominio" />
          <USelect v-model="form.status" :items="['active', 'inactive', 'suspended']" />
          <USelect v-model="form.plan" :items="['free', 'basic', 'pro', 'enterprise']" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="modalOpen = false">Cancelar</UButton>
          <UButton color="primary" :loading="saving" @click="saveTenant">{{ editing ? 'Actualizar' : 'Guardar' }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
