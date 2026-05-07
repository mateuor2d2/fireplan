<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInstruccionesStore } from '~/stores/instrucciones'
import { useUserStore } from '~/stores/user'
import { useOverlay } from '#imports'
import { LazyModalInstruccionCreate } from '#components'
import type { Instruccion, MiniInstruccion } from '~/stores/instrucciones'

interface Props {
  obraId: string
  obraName: string
}

const props = defineProps<Props>()

// Overlay for programmatic modals (Nuxt UI v4 pattern)
const overlay = useOverlay()

// Stores
const instruccionesStore = useInstruccionesStore()
const userStore = useUserStore()

// State
const instrucciones = ref<MiniInstruccion[]>([])
const loading = ref(false)
const isDetailOpen = ref(false)
const currentInstruccion = ref<Instruccion | null>(null)

// Filtros
const filters = ref({
  estado: [] as string[],
  prioridad: [] as string[],
  tarea: ''
})

// Estados disponibles
const estadosDisponibles = [
  { label: 'Borrador', value: 'borrador', color: 'gray' },
  { label: 'Emitida', value: 'emitida', color: 'blue' },
  { label: 'Recibida', value: 'recibida', color: 'yellow' },
  { label: 'En ejecucion', value: 'en_ejecucion', color: 'orange' },
  { label: 'Completada', value: 'completada', color: 'green' },
  { label: 'Cerrada', value: 'cerrada', color: 'primary' },
  { label: 'Cancelada', value: 'cancelada', color: 'red' }
]

const prioridadesDisponibles = [
  { label: 'Baja', value: 'baja', color: 'green' },
  { label: 'Media', value: 'media', color: 'yellow' },
  { label: 'Alta', value: 'alta', color: 'orange' },
  { label: 'Urgente', value: 'urgente', color: 'red' }
]

// Computed
const filteredInstrucciones = computed(() => {
  let result = instrucciones.value

  if (filters.value.estado.length > 0) {
    result = result.filter(i => filters.value.estado.includes(i.estado))
  }

  if (filters.value.prioridad.length > 0) {
    result = result.filter(i => filters.value.prioridad.includes(i.prioridad))
  }

  if (filters.value.tarea) {
    result = result.filter(i =>
      i.tarea.toLowerCase().includes(filters.value.tarea.toLowerCase())
    )
  }

  return result
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.estado.length > 0) count++
  if (filters.value.prioridad.length > 0) count++
  if (filters.value.tarea) count++
  return count
})

// Methods
async function fetchInstrucciones() {
  loading.value = true
  try {
    const response = await instruccionesStore.fetchInstrucciones(props.obraId)
    instrucciones.value = response.data.map((i: any) => ({
      id: i.id || i._id?.toString(),
      titulo: i.titulo,
      tarea: i.tarea,
      estado: i.estado,
      prioridad: i.prioridad,
      emitidoPorNombre: i.emitidoPorNombre,
      fechaInicio: i.fechaInicio,
      fechaFin: i.fechaFin,
      referencia: i.referencia,
      riesgoCount: i.riesgos?.length || 0,
      firmaCount: i.firmas?.length || 0,
      comentarioCount: i.comentarios?.length || 0
    }))
  } catch (err) {
    console.error('Error fetching instrucciones:', err)
  } finally {
    loading.value = false
  }
}

async function fetchConceptosPlan() {
  try {
    const response = await instruccionesStore.fetchConceptosPlan(props.obraId)
    return response.data.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      capitulo: c.capitulo,
      capituloTitle: c.capituloTitle
    }))
  } catch (err) {
    console.error('Error fetching conceptos:', err)
    return []
  }
}

// Programmatic modal creation using useOverlay (Nuxt UI v4 pattern)
async function openCreateModal() {
  const conceptos = await fetchConceptosPlan()

  const modal = overlay.create(LazyModalInstruccionCreate, {
    props: {
      obraId: props.obraId,
      conceptosDisponibles: conceptos,
      onClose: async (result: any) => {
        if (result && result.success) {
          await fetchInstrucciones()
        }
      }
    }
  })

  await modal.open()
}

async function viewInstruccion(id: string) {
  try {
    await instruccionesStore.fetchInstruccion(id)
    currentInstruccion.value = instruccionesStore.instruccionActual
    isDetailOpen.value = true
  } catch (err) {
    console.error('Error fetching instruccion detail:', err)
  }
}

async function cambiarEstado(id: string, nuevoEstado: string) {
  try {
    const user = userStore.user
    await instruccionesStore.cambiarEstado(
      id,
      nuevoEstado,
      user?.name || user?.email || 'Usuario',
      user?.rol || 'tecnico'
    )
    await fetchInstrucciones()
    if (currentInstruccion.value?.id === id) {
      await viewInstruccion(id)
    }
  } catch (err) {
    console.error('Error cambiando estado:', err)
  }
}

function getEstadoLabel(estado: string) {
  return estadosDisponibles.find(e => e.value === estado)?.label || estado
}

function getEstadoColor(estado: string) {
  return estadosDisponibles.find(e => e.value === estado)?.color || 'gray'
}

function getPrioridadLabel(prioridad: string) {
  return prioridadesDisponibles.find(p => p.value === prioridad)?.label || prioridad
}

function getPrioridadColor(prioridad: string) {
  return prioridadesDisponibles.find(p => p.value === prioridad)?.color || 'gray'
}

function clearFilters() {
  filters.value = {
    estado: [],
    prioridad: [],
    tarea: ''
  }
}

function formatDate(date: string | Date | undefined) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Lifecycle
onMounted(() => {
  fetchInstrucciones()
})
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          @click="openCreateModal"
        >
          Nueva Instruccion
        </UButton>

        <UButton
          icon="i-heroicons-arrow-path"
          variant="ghost"
          :loading="loading"
          @click="fetchInstrucciones"
        >
          Actualizar
        </UButton>
      </div>

      <div class="flex items-center gap-2">
        <UBadge v-if="activeFilterCount > 0" color="primary">
          {{ activeFilterCount }} filtro(s)
        </UBadge>
        <UButton
          v-if="activeFilterCount > 0"
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          @click="clearFilters"
        >
          Limpiar
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <USelectMenu
        v-model="filters.estado"
        :options="estadosDisponibles"
        option-attribute="label"
        value-attribute="value"
        multiple
        placeholder="Filtrar por estado"
        class="w-48"
      />
      <USelectMenu
        v-model="filters.prioridad"
        :options="prioridadesDisponibles"
        option-attribute="label"
        value-attribute="value"
        multiple
        placeholder="Filtrar por prioridad"
        class="w-48"
      />
      <UInput
        v-model="filters.tarea"
        icon="i-heroicons-magnifying-glass"
        placeholder="Buscar por tarea..."
        class="w-64"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredInstrucciones.length === 0"
      class="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl"
    >
      <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No hay instrucciones
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Crea la primera instruccion de obra para este plan.
      </p>
      <UButton color="primary" @click="openCreateModal">
        Crear Instruccion
      </UButton>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Referencia</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Titulo</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Tarea</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Estado</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Prioridad</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Emisor</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Inicio</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Fin</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Riesgos</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Firmas</th>
            <th class="py-3 px-4 font-semibold text-gray-900 dark:text-white">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="inst in filteredInstrucciones"
            :key="inst.id"
            class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
            @click="viewInstruccion(inst.id)"
          >
            <td class="py-3 px-4 font-mono text-sm text-gray-600 dark:text-gray-400">
              {{ inst.referencia || '-' }}
            </td>
            <td class="py-3 px-4 text-gray-900 dark:text-white font-medium">
              {{ inst.titulo }}
            </td>
            <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
              {{ inst.tarea }}
            </td>
            <td class="py-3 px-4">
              <UBadge :color="getEstadoColor(inst.estado)" size="sm">
                {{ getEstadoLabel(inst.estado) }}
              </UBadge>
            </td>
            <td class="py-3 px-4">
              <UBadge :color="getPrioridadColor(inst.prioridad)" variant="subtle" size="sm">
                {{ getPrioridadLabel(inst.prioridad) }}
              </UBadge>
            </td>
            <td class="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
              {{ inst.emitidoPorNombre }}
            </td>
            <td class="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
              {{ formatDate(inst.fechaInicio) }}
            </td>
            <td class="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
              {{ formatDate(inst.fechaFin) }}
            </td>
            <td class="py-3 px-4 text-center">
              <UBadge v-if="inst.riesgoCount > 0" color="orange" size="sm">
                {{ inst.riesgoCount }}
              </UBadge>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="py-3 px-4 text-center">
              <UBadge v-if="inst.firmaCount > 0" color="blue" size="sm">
                {{ inst.firmaCount }}
              </UBadge>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-1" @click.stop>
                <UDropdownMenu
                  :items="[
                    { label: 'Ver detalle', icon: 'i-heroicons-eye', onSelect: () => viewInstruccion(inst.id) },
                    ...(inst.estado === 'emitida' ? [{ label: 'Marcar recibida', icon: 'i-heroicons-check', onSelect: () => cambiarEstado(inst.id, 'recibida') }] : []),
                    ...(inst.estado === 'recibida' ? [{ label: 'Iniciar ejecucion', icon: 'i-heroicons-play', onSelect: () => cambiarEstado(inst.id, 'en_ejecucion') }] : []),
                    ...(inst.estado === 'en_ejecucion' ? [{ label: 'Completar', icon: 'i-heroicons-check-circle', onSelect: () => cambiarEstado(inst.id, 'completada') }] : []),
                    ...(inst.estado === 'completada' ? [{ label: 'Cerrar', icon: 'i-heroicons-lock-closed', onSelect: () => cambiarEstado(inst.id, 'cerrada') }] : []),
                  ]"
                >
                  <UButton icon="i-heroicons-ellipsis-vertical" variant="ghost" size="sm" />
                </UDropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal (kept as v-model for viewing, not creating) -->
    <UModal v-model="isDetailOpen" :ui="{ width: 'lg:max-w-4xl' }">
      <UCard v-if="currentInstruccion">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">{{ currentInstruccion.titulo }}</h3>
              <p class="text-sm text-gray-500">{{ currentInstruccion.referencia }}</p>
            </div>
            <UButton icon="i-heroicons-x-mark" variant="ghost" size="sm" @click="isDetailOpen = false" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Info general -->
          <div class="flex flex-wrap gap-4">
            <UBadge :color="getEstadoColor(currentInstruccion.estado)" size="md">
              {{ getEstadoLabel(currentInstruccion.estado) }}
            </UBadge>
            <UBadge :color="getPrioridadColor(currentInstruccion.prioridad)" variant="subtle" size="md">
              {{ getPrioridadLabel(currentInstruccion.prioridad) }}
            </UBadge>
            <span class="text-sm text-gray-600">
              Tarea: <strong>{{ currentInstruccion.tarea }}</strong>
            </span>
            <span class="text-sm text-gray-600">
              Emisor: <strong>{{ currentInstruccion.emitidoPorNombre }}</strong>
            </span>
          </div>

          <p class="text-gray-700 dark:text-gray-300">{{ currentInstruccion.descripcion }}</p>

          <!-- Fechas -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <span class="text-gray-500">Inicio:</span> {{ formatDate(currentInstruccion.fechaInicio) }}
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <span class="text-gray-500">Fin estimada:</span> {{ formatDate(currentInstruccion.fechaFin) }}
            </div>
          </div>

          <!-- Riesgos -->
          <div v-if="currentInstruccion.riesgos?.length > 0">
            <h4 class="font-semibold mb-2">Riesgos vinculados del Plan</h4>
            <div class="space-y-2">
              <div
                v-for="riesgo in currentInstruccion.riesgos"
                :key="riesgo.conceptoId"
                class="p-3 border border-gray-200 dark:border-gray-700 rounded"
              >
                <div class="font-medium">{{ riesgo.nombreConcepto }}</div>
                <div class="text-sm text-gray-600">
                  Riesgo: {{ riesgo.tipoRiesgo }} | Prob: {{ riesgo.probabilidad }} | Grav: {{ riesgo.gravedad }}
                </div>
                <div v-if="riesgo.epis?.length" class="text-sm mt-1">
                  <span class="text-gray-500">EPIs:</span> {{ riesgo.epis.join(', ') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Firmas -->
          <div v-if="currentInstruccion.firmas?.length > 0">
            <h4 class="font-semibold mb-2">Trazabilidad de firmas</h4>
            <div class="space-y-2">
              <div
                v-for="firma in currentInstruccion.firmas"
                :key="firma.userId + firma.tipoFirma"
                class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <UIcon name="i-heroicons-check-badge" class="w-5 h-5 text-green-500" />
                <div>
                  <div class="text-sm font-medium">{{ firma.userName }} ({{ firma.rol }})</div>
                  <div class="text-xs text-gray-500">
                    {{ firma.tipoFirma }} - {{ formatDate(firma.firmadoAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones de estado -->
          <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton
              v-if="currentInstruccion.estado === 'emitida'"
              color="yellow"
              icon="i-heroicons-check"
              @click="cambiarEstado(currentInstruccion.id, 'recibida')"
            >
              Marcar recibida
            </UButton>
            <UButton
              v-if="currentInstruccion.estado === 'recibida'"
              color="orange"
              icon="i-heroicons-play"
              @click="cambiarEstado(currentInstruccion.id, 'en_ejecucion')"
            >
              Iniciar ejecucion
            </UButton>
            <UButton
              v-if="currentInstruccion.estado === 'en_ejecucion'"
              color="green"
              icon="i-heroicons-check-circle"
              @click="cambiarEstado(currentInstruccion.id, 'completada')"
            >
              Completar
            </UButton>
            <UButton
              v-if="currentInstruccion.estado === 'completada'"
              color="primary"
              icon="i-heroicons-lock-closed"
              @click="cambiarEstado(currentInstruccion.id, 'cerrada')"
            >
              Cerrar instruccion
            </UButton>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>
