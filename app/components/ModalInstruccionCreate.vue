<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInstruccionesStore } from '~/stores/instrucciones'
import { useUserStore } from '~/stores/user'

interface Props {
  obraId: string
  conceptosDisponibles: Array<{
    id: string
    nombre: string
    descripcion: string
    capitulo: number
    capituloTitle: string
  }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close', value: { success: boolean; data?: any }): void
}>()

// Stores
const instruccionesStore = useInstruccionesStore()
const userStore = useUserStore()

// Form state
const titulo = ref('')
const descripcion = ref('')
const tarea = ref('')
const prioridad = ref<'baja' | 'media' | 'alta' | 'urgente'>('media')
const fechaInicio = ref(new Date().toISOString().slice(0, 10))
const fechaFin = ref('')
const conceptosPlanIds = ref<string[]>([])
const submitting = ref(false)

// Tareas comunes
const tareasComunes = [
  'Cubierta',
  'Excavacion',
  'Encofrado',
  'Demolicion',
  'Albanileria',
  'Electricidad',
  'Fontaneria',
  'Soldadura',
  'Pintura',
  'Instalacion',
  'Mantenimiento',
  'Otra'
]

const prioridadesDisponibles = [
  { label: 'Baja', value: 'baja', color: 'green' },
  { label: 'Media', value: 'media', color: 'yellow' },
  { label: 'Alta', value: 'alta', color: 'orange' },
  { label: 'Urgente', value: 'urgente', color: 'red' }
]

const canCreate = computed(() => {
  return titulo.value.trim().length > 0 && tarea.value.length > 0
})

async function onSubmit() {
  if (!canCreate.value || submitting.value) return

  submitting.value = true
  try {
    const user = userStore.user
    const result = await instruccionesStore.crearInstruccion({
      obraId: props.obraId,
      titulo: titulo.value,
      descripcion: descripcion.value,
      tarea: tarea.value,
      emitidoPorNombre: user?.name || user?.email || 'Usuario',
      nivelEmisor: user?.rol || 'tecnico',
      prioridad: prioridad.value,
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value || undefined,
      conceptosPlanIds: conceptosPlanIds.value,
      asignadoA: [],
      asignadoANombres: []
    })

    const toast = useToast()
    toast.add({
      title: 'Instruccion creada',
      description: `Referencia: ${result.referencia || result.data?.referencia}`,
      color: 'success'
    })

    emit('close', { success: true, data: result })
  } catch (err: any) {
    console.error('Error creating instruccion:', err)
    const toast = useToast()
    toast.add({
      title: 'Error al crear',
      description: err.message || 'No se pudo crear la instruccion',
      color: 'error'
    })
    emit('close', { success: false })
  } finally {
    submitting.value = false
  }
}

function onCancel() {
  emit('close', { success: false })
}
</script>

<template>
  <UModal :ui="{ width: 'lg:max-w-3xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            Nueva Instruccion de Obra
          </h3>
          <UButton icon="i-heroicons-x-mark" variant="ghost" size="sm" @click="onCancel" />
        </div>
      </template>

      <div class="space-y-4">
        <UFormGroup label="Titulo *" required>
          <UInput v-model="titulo" placeholder="Ej: Instruccion para trabajos en cubierta" />
        </UFormGroup>

        <UFormGroup label="Tarea *" required>
          <USelectMenu
            v-model="tarea"
            :options="tareasComunes"
            placeholder="Selecciona tipo de tarea"
            searchable
            creatable
          />
        </UFormGroup>

        <UFormGroup label="Descripcion">
          <UTextarea
            v-model="descripcion"
            placeholder="Describe la instruccion, alcance y condiciones..."
            :rows="4"
          />
        </UFormGroup>

        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Prioridad">
            <USelectMenu
              v-model="prioridad"
              :options="prioridadesDisponibles"
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>

          <UFormGroup label="Fecha inicio">
            <UInput v-model="fechaInicio" type="date" />
          </UFormGroup>
        </div>

        <UFormGroup label="Fecha fin estimada">
          <UInput v-model="fechaFin" type="date" />
        </UFormGroup>

        <UFormGroup label="Vincular riesgos del Plan (opcional)">
          <USelectMenu
            v-model="conceptosPlanIds"
            :options="conceptosDisponibles"
            option-attribute="nombre"
            value-attribute="id"
            multiple
            placeholder="Selecciona conceptos/partidas del plan"
          >
            <template #option="{ option }">
              <div>
                <div class="font-medium">{{ option.nombre }}</div>
                <div class="text-xs text-gray-500">Cap. {{ option.capitulo }} - {{ option.capituloTitle }}</div>
              </div>
            </template>
          </USelectMenu>
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="onCancel">
            Cancelar
          </UButton>
          <UButton color="primary" :disabled="!canCreate" :loading="submitting" @click="onSubmit">
            Crear instruccion
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
