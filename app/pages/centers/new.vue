<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Nuevo Centro de Trabajo</h1>

    <UForm :state="form" @submit="createCenter">
      <div class="space-y-4">
        <UFormGroup label="Nombre" required>
          <UInput v-model="form.name" placeholder="Nombre del centro" />
        </UFormGroup>

        <UFormGroup label="Dirección" required>
          <UInput v-model="form.address" placeholder="Dirección completa" />
        </UFormGroup>

        <UFormGroup label="Actividad" required>
          <USelect
            v-model="form.activity"
            :options="activities"
            placeholder="Selecciona actividad"
          />
        </UFormGroup>

        <UFormGroup label="Sector" required>
          <USelect
            v-model="form.sector"
            :options="sectors"
            placeholder="Selecciona sector"
          />
        </UFormGroup>

        <UFormGroup label="Ocupación máxima">
          <UInput v-model="form.maxOccupancy" type="number" placeholder="Número de personas" />
        </UFormGroup>

        <UFormGroup label="Persona de contacto">
          <UInput v-model="form.contactPerson" placeholder="Nombre y cargo" />
        </UFormGroup>

        <UFormGroup label="Teléfono">
          <UInput v-model="form.phone" placeholder="Teléfono de contacto" />
        </UFormGroup>

        <UFormGroup label="Email">
          <UInput v-model="form.email" type="email" placeholder="email@ejemplo.com" />
        </UFormGroup>
      </div>

      <div class="flex gap-4 mt-6">
        <UButton type="submit" color="primary" label="Crear Centro" :loading="saving" />
        <UButton to="/centers" color="gray" variant="ghost" label="Cancelar" />
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const router = useRouter()

const form = reactive({
  name: '',
  address: '',
  activity: '',
  sector: '',
  maxOccupancy: null,
  contactPerson: '',
  phone: '',
  email: ''
})

const saving = ref(false)

const activities = [
  'Hotel y alojamiento',
  'Restauración',
  'Oficinas',
  'Comercio',
  'Industria',
  'Educación',
  'Sanidad',
  'Deporte',
  'Otro'
]

const sectors = [
  'Servicios',
  'Industria',
  'Comercio',
  'Construcción',
  'Hostelería',
  'Educación',
  'Sanidad',
  'Transporte',
  'Otro'
]

async function createCenter() {
  saving.value = true
  try {
    await $fetch('/api/v1/centers', {
      method: 'POST',
      body: form
    })
    toast.add({
      title: 'Éxito',
      description: 'Centro creado correctamente',
      color: 'green'
    })
    router.push('/centers')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}
</script>
