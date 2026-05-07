<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Nuevo Plan de Emergencia</h1>

    <!-- Progress Steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            :class="currentStep >= index ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
          >
            {{ index + 1 }}
          </div>
          <span
            class="ml-2 text-sm hidden md:block"
            :class="currentStep >= index ? 'text-primary font-medium' : 'text-gray-500'"
          >
            {{ step.name }}
          </span>
          <div v-if="index < steps.length - 1" class="w-12 h-0.5 mx-2" :class="currentStep > index ? 'bg-primary' : 'bg-gray-200'" />
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <UCard class="mb-6">
      <template #header>
        <h2 class="text-lg font-semibold">{{ steps[currentStep].name }}</h2>
      </template>

      <!-- Paso 1: Identificación -->
      <div v-if="currentStep === 0">
        <div class="space-y-4">
          <UFormGroup label="Tipo de plan" required>
            <USelect v-model="form.type" :options="planTypes" placeholder="Selecciona tipo" />
          </UFormGroup>

          <UFormGroup label="Normativa aplicable" required>
            <USelect v-model="form.normativa" :options="normativas" placeholder="Selecciona normativa" />
          </UFormGroup>

          <UFormGroup label="Descripción">
            <UTextarea v-model="form.description" placeholder="Descripción del centro y su entorno" rows="4" />
          </UFormGroup>
        </div>
      </div>

      <!-- Paso 2: Análisis de Riesgos -->
      <div v-if="currentStep === 1">
        <div class="space-y-4">
          <div v-for="(risk, index) in form.risks" :key="index" class="p-4 border rounded-lg">
            <div class="flex justify-between items-start mb-2">
              <UFormGroup label="Tipo de riesgo" class="flex-1">
                <USelect v-model="risk.type" :options="riskTypes" />
              </UFormGroup>
              <UButton icon="i-heroicons-trash" color="red" variant="ghost" @click="removeRisk(index)" />
            </div>
            <UFormGroup label="Descripción">
              <UTextarea v-model="risk.description" placeholder="Descripción del riesgo" rows="2" />
            </UFormGroup>
            <div class="grid grid-cols-2 gap-4 mt-2">
              <UFormGroup label="Probabilidad">
                <USelect v-model="risk.probability" :options="['Baja', 'Media', 'Alta']" />
              </UFormGroup>
              <UFormGroup label="Severidad">
                <USelect v-model="risk.severity" :options="['Baja', 'Media', 'Alta', 'Crítica']" />
              </UFormGroup>
            </div>
          </div>
          <UButton icon="i-heroicons-plus" label="Añadir riesgo" color="gray" @click="addRisk" />
        </div>
      </div>

      <!-- Paso 3: Medidas Preventivas -->
      <div v-if="currentStep === 2">
        <div class="space-y-4">
          <div v-for="(measure, index) in form.measures" :key="index" class="p-4 border rounded-lg">
            <div class="flex justify-between items-start mb-2">
              <UFormGroup label="Medida" class="flex-1">
                <UInput v-model="measure.name" placeholder="Nombre de la medida" />
              </UFormGroup>
              <UButton icon="i-heroicons-trash" color="red" variant="ghost" @click="removeMeasure(index)" />
            </div>
            <UFormGroup label="Descripción">
              <UTextarea v-model="measure.description" placeholder="Descripción detallada" rows="2" />
            </UFormGroup>
            <UFormGroup label="Responsable">
              <UInput v-model="measure.responsible" placeholder="Persona o departamento responsable" />
            </UFormGroup>
          </div>
          <UButton icon="i-heroicons-plus" label="Añadir medida" color="gray" @click="addMeasure" />
        </div>
      </div>

      <!-- Paso 4: Organización -->
      <div v-if="currentStep === 3">
        <div class="space-y-4">
          <h3 class="font-medium">Equipo de Emergencias</h3>
          <div v-for="(role, index) in form.emergencyTeam" :key="index" class="p-4 border rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Rol">
                <USelect v-model="role.role" :options="emergencyRoles" />
              </UFormGroup>
              <UFormGroup label="Nombre">
                <UInput v-model="role.name" placeholder="Nombre completo" />
              </UFormGroup>
            </div>
            <UFormGroup label="Teléfono" class="mt-2">
              <UInput v-model="role.phone" placeholder="Teléfono de contacto" />
            </UFormGroup>
          </div>
          <UButton icon="i-heroicons-plus" label="Añadir miembro" color="gray" @click="addTeamMember" />
        </div>
      </div>

      <!-- Paso 5: Recursos -->
      <div v-if="currentStep === 4">
        <div class="space-y-4">
          <h3 class="font-medium">Recursos y Equipamiento</h3>
          <div v-for="(resource, index) in form.resources" :key="index" class="p-4 border rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Recurso">
                <UInput v-model="resource.name" placeholder="Nombre del recurso" />
              </UFormGroup>
              <UFormGroup label="Tipo">
                <USelect v-model="resource.type" :options="['Extintor', 'Hidrante', 'Botiquín', 'AED', 'Alarma', 'Señalización', 'Otro']" />
              </UFormGroup>
            </div>
            <UFormGroup label="Ubicación" class="mt-2">
              <UInput v-model="resource.location" placeholder="Ubicación exacta" />
            </UFormGroup>
            <UFormGroup label="Cantidad">
              <UInput v-model="resource.quantity" type="number" />
            </UFormGroup>
          </div>
          <UButton icon="i-heroicons-plus" label="Añadir recurso" color="gray" @click="addResource" />
        </div>
      </div>

      <!-- Paso 6: Procedimientos -->
      <div v-if="currentStep === 5">
        <div class="space-y-4">
          <h3 class="font-medium">Procedimientos de Actuación</h3>
          <div v-for="(procedure, index) in form.procedures" :key="index" class="p-4 border rounded-lg">
            <UFormGroup label="Situación de emergencia">
              <USelect v-model="procedure.emergencyType" :options="['Incendio', 'Evacuación', 'Primeros auxilios', 'Amenaza bombas', 'Inundación', 'Seísmo', 'Otro']" />
            </UFormGroup>
            <UFormGroup label="Procedimiento" class="mt-2">
              <UTextarea v-model="procedure.steps" placeholder="Pasos a seguir..." rows="4" />
            </UFormGroup>
            <UFormGroup label="Puntos de encuentro">
              <UInput v-model="procedure.meetingPoint" placeholder="Ubicación punto de encuentro" />
            </UFormGroup>
          </div>
          <UButton icon="i-heroicons-plus" label="Añadir procedimiento" color="gray" @click="addProcedure" />
        </div>
      </div>

      <!-- Paso 7: Formación -->
      <div v-if="currentStep === 6">
        <div class="space-y-4">
          <h3 class="font-medium">Plan de Formación</h3>
          <UFormGroup label="Tipo de formación">
            <USelect v-model="form.training.type" :options="['Presencial', 'Online', 'Mixta']" />
          </UFormGroup>
          
          <UFormGroup label="Frecuencia">
            <USelect v-model="form.training.frequency" :options="['Mensual', 'Trimestral', 'Semestral', 'Anual']" />
          </UFormGroup>
          
          <UFormGroup label="Contenidos">
            <UTextarea v-model="form.training.content" placeholder="Contenidos de la formación" rows="4" />
          </UFormGroup>
          
          <UFormGroup label="Responsable de formación">
            <UInput v-model="form.training.responsible" placeholder="Nombre del responsable" />
          </UFormGroup>
        </div>
      </div>
    </UCard>

    <!-- Navigation -->
    <div class="flex justify-between">
      <UButton
        v-if="currentStep > 0"
        icon="i-heroicons-arrow-left"
        label="Anterior"
        color="gray"
        @click="prevStep"
      />
      <div v-else />

      <div class="flex gap-2">
        <UButton
          v-if="currentStep < steps.length - 1"
          icon="i-heroicons-arrow-right"
          label="Siguiente"
          color="primary"
          @click="nextStep"
        />
        <UButton
          v-else
          icon="i-heroicons-check"
          label="Finalizar y Guardar"
          color="primary"
          :loading="saving"
          @click="savePlan"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

const centerId = route.params.centerId as string

const currentStep = ref(0)
const saving = ref(false)

const steps = [
  { id: 'identification', name: 'Identificación' },
  { id: 'risks', name: 'Riesgos' },
  { id: 'measures', name: 'Medidas' },
  { id: 'organization', name: 'Organización' },
  { id: 'resources', name: 'Recursos' },
  { id: 'procedures', name: 'Procedimientos' },
  { id: 'training', name: 'Formación' }
]

const planTypes = ['Plan de Emergencia', 'Plan de Autoprotección', 'Plan de Evacuación', 'Plan de Continuidad']
const normativas = ['RD 393/2007', 'RD 314/2006', 'ITC EP 01', 'Normativa local', 'Otra']
const riskTypes = ['Incendio', 'Explosión', 'Derrame', 'Colapso', 'Eléctrico', 'Químico', 'Biológico', 'Radiológico', 'Natural', 'Terrorista', 'Otro']
const emergencyRoles = ['Jefe de Emergencias', 'Brigadista', 'Primeros Auxilios', 'Evacuación', 'Comunicaciones', 'Extinción', 'Otro']

const form = reactive({
  centerId,
  type: '',
  normativa: '',
  description: '',
  risks: [{ type: '', description: '', probability: 'Baja', severity: 'Baja' }],
  measures: [{ name: '', description: '', responsible: '' }],
  emergencyTeam: [{ role: '', name: '', phone: '' }],
  resources: [{ name: '', type: 'Extintor', location: '', quantity: 1 }],
  procedures: [{ emergencyType: '', steps: '', meetingPoint: '' }],
  training: { type: 'Presencial', frequency: 'Anual', content: '', responsible: '' }
})

function nextStep() {
  if (currentStep.value < steps.length - 1) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function addRisk() {
  form.risks.push({ type: '', description: '', probability: 'Baja', severity: 'Baja' })
}

function removeRisk(index: number) {
  form.risks.splice(index, 1)
}

function addMeasure() {
  form.measures.push({ name: '', description: '', responsible: '' })
}

function removeMeasure(index: number) {
  form.measures.splice(index, 1)
}

function addTeamMember() {
  form.emergencyTeam.push({ role: '', name: '', phone: '' })
}

function addResource() {
  form.resources.push({ name: '', type: 'Extintor', location: '', quantity: 1 })
}

function addProcedure() {
  form.procedures.push({ emergencyType: '', steps: '', meetingPoint: '' })
}

async function savePlan() {
  saving.value = true
  try {
    await $fetch('/api/v1/plans', {
      method: 'POST',
      body: {
        centerId: form.centerId,
        type: form.type,
        normativa: form.normativa,
        description: form.description,
        risks: form.risks,
        measures: form.measures,
        emergencyTeam: form.emergencyTeam,
        resources: form.resources,
        procedures: form.procedures,
        training: form.training
      }
    })
    toast.add({
      title: 'Éxito',
      description: 'Plan de emergencia creado correctamente',
      color: 'green'
    })
    router.push(`/centers/${centerId}`)
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
