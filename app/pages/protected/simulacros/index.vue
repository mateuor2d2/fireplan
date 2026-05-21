<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Simulacros</h1>
        <p class="text-gray-500">Gestiona los simulacros de emergencia</p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" @click="showCreateModal = true">Nuevo Simulacro</UButton>
    </div>
    <div v-if="loading" class="text-center py-8"><UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" /></div>
    <div v-else-if="simulacros.length === 0" class="text-gray-500 py-8 text-center">No hay simulacros registrados.</div>
    <div v-else class="space-y-4">
      <UCard v-for="sim in simulacros" :key="sim._id">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ sim.tipo }}</span>
              <UBadge :color="getResultadoColor(sim.evaluacion?.resultado)" size="sm">{{ sim.evaluacion?.resultado }}</UBadge>
            </div>
            <span class="text-sm text-gray-500">{{ new Date(sim.fecha).toLocaleDateString() }}</span>
          </div>
        </template>
        <div class="text-sm space-y-1">
          <p><strong>Escenario:</strong> {{ sim.escenario }}</p>
          <p v-if="sim.evaluacion?.tiempoEvacuacion"><strong>Tiempo evacuación:</strong> {{ sim.evaluacion.tiempoEvacuacion }} min</p>
          <p v-if="sim.evaluacion?.cumplimientoNormativa"><strong>Cumplimiento:</strong> {{ sim.evaluacion.cumplimientoNormativa }}%</p>
          <p><strong>Participantes:</strong> {{ sim.participantes?.length || 0 }}</p>
        </div>
        <template #footer>
          <div class="flex gap-2">
            <UButton size="xs" variant="ghost" icon="i-heroicons-eye" @click="viewSimulacro(sim)">Ver</UButton>
            <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" color="warning" @click="editSimulacro(sim)">Editar</UButton>
            <UButton size="xs" variant="ghost" icon="i-heroicons-trash" color="error" @click="deleteSimulacro(sim._id)">Eliminar</UButton>
          </div>
        </template>
      </UCard>
    </div>
    <!-- Create/Edit Modal -->
    <UModal v-model:open="modalOpen">
      <template #header><h3 class="text-lg font-semibold">{{ editing ? 'Editar' : 'Nuevo' }} Simulacro</h3></template>
      <template #body>
        <div class="space-y-3">
          <USelectMenu v-model="form.tipo" :items="tipoOptions" value-key="value" label-key="label" placeholder="Tipo" />
          <UInput v-model="form.escenario" placeholder="Escenario" />
          <UFormField label="Fecha"><UInput v-model="form.fecha" type="date" /></UFormField>
          <USelectMenu v-model="form.evaluacion.resultado" :items="resultadoOptions" value-key="value" label-key="label" placeholder="Resultado" />
          <UInput v-model.number="form.evaluacion.tiempoEvacuacion" placeholder="Tiempo evacuación (min)" type="number" />
          <UInput v-model.number="form.evaluacion.cumplimientoNormativa" placeholder="Cumplimiento normativa (%)" type="number" min="0" max="100" />
          <UTextarea v-model="form.evaluacion.puntosFuertes" placeholder="Puntos fuertes (uno por línea)" />
          <UTextarea v-model="form.evaluacion.puntosDebil" placeholder="Puntos débiles (uno por línea)" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="modalOpen = false">Cancelar</UButton>
          <UButton color="primary" :loading="saving" @click="saveSimulacro">{{ editing ? 'Actualizar' : 'Guardar' }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'app' })
const toast = useToast()
const simulacros = ref<any[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const editing = ref(false)
const saving = ref(false)
const currentId = ref('')

const tipoOptions = [
  { label: 'Evacuación', value: 'evacuacion' },
  { label: 'Incendio', value: 'incendio' },
  { label: 'Explosión', value: 'explosion' },
  { label: 'Amenaza bomba', value: 'amenaza_bomba' },
  { label: 'Químico', value: 'quimico' },
  { label: 'Otro', value: 'otro' }
]

const resultadoOptions = [
  { label: 'Satisfactorio', value: 'satisfactorio' },
  { label: 'Mejorable', value: 'mejorable' },
  { label: 'Insatisfactorio', value: 'insatisfactorio' }
]

const form = reactive({
  centerId: '',
  tipo: '',
  escenario: '',
  fecha: '',
  evaluacion: {
    tiempoEvacuacion: undefined as number | undefined,
    cumplimientoNormativa: undefined as number | undefined,
    resultado: '' as string,
    puntosFuertes: '',
    puntosDebil: ''
  }
})

function getResultadoColor(resultado: string) {
  const colors: Record<string, string> = { satisfactorio: 'success', mejorable: 'warning', insatisfactorio: 'error' }
  return colors[resultado] || 'neutral'
}

async function fetchSimulacros() {
  loading.value = true
  try {
    const res = await $fetch('/api/v1/simulacros') as any
    simulacros.value = res.data || []
  } catch (e) { toast.add({ title: 'Error', description: 'No se pudieron cargar los simulacros', color: 'error' }) }
  finally { loading.value = false }
}

function viewSimulacro(sim: any) { /* TODO: navigate to detail */ }

function editSimulacro(sim: any) {
  editing.value = true
  currentId.value = sim._id
  Object.assign(form, {
    centerId: sim.centerId,
    tipo: sim.tipo,
    escenario: sim.escenario,
    fecha: sim.fecha ? new Date(sim.fecha).toISOString().split('T')[0] : '',
    evaluacion: {
      tiempoEvacuacion: sim.evaluacion?.tiempoEvacuacion,
      cumplimientoNormativa: sim.evaluacion?.cumplimientoNormativa,
      resultado: sim.evaluacion?.resultado || '',
      puntosFuertes: (sim.evaluacion?.puntosFuertes || []).join('\n'),
      puntosDebil: (sim.evaluacion?.puntosDebil || []).join('\n')
    }
  })
  modalOpen.value = true
}

async function saveSimulacro() {
  saving.value = true
  try {
    const payload = {
      ...form,
      fecha: form.fecha ? new Date(form.fecha) : undefined,
      evaluacion: {
        ...form.evaluacion,
        puntosFuertes: form.evaluacion.puntosFuertes.split('\n').filter((s: string) => s.trim()),
        puntosDebil: form.evaluacion.puntosDebil.split('\n').filter((s: string) => s.trim()),
        incidencias: []
      }
    }
    if (editing.value) {
      await $fetch(`/api/v1/simulacros/${currentId.value}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Simulacro actualizado', color: 'success' })
    } else {
      await $fetch('/api/v1/simulacros', { method: 'POST', body: payload })
      toast.add({ title: 'Simulacro creado', color: 'success' })
    }
    modalOpen.value = false
    await fetchSimulacros()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
  finally { saving.value = false }
}

async function deleteSimulacro(id: string) {
  if (!confirm('¿Eliminar este simulacro?')) return
  try {
    await $fetch(`/api/v1/simulacros/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Simulacro eliminado', color: 'success' })
    await fetchSimulacros()
  } catch (e: any) { toast.add({ title: 'Error', description: e.message, color: 'error' }) }
}

onMounted(fetchSimulacros)
</script>
