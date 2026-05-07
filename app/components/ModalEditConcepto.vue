<script setup lang="ts">
import type { z } from 'zod'
import { useConceptoStore } from '@/stores/conceptos'
import { useUserStore } from '@/stores/user'
import { usePlanesStore } from '@/stores/planes'
import { schemaConcepto } from '@/schemas/conceptos'
import type { FormSubmitEvent } from '#ui/types'
import type { MiniConcepto, EvaluacionActual } from '@/stores/conceptos'

interface Props {
  modelValue: boolean
  concepto: MiniConcepto | null
  isEdit: boolean // true for edit, false for copy
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', concepto: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const conceptoStore = useConceptoStore()
const userStore = useUserStore()
const planesStore = usePlanesStore()
const toast = useToast()

const isLoading = ref(false)
const saveScope = ref<'plan' | 'permanent'>('plan')
const showScopeDialog = ref(false)

// Form state
const state = reactive({
  nom_concepto: '',
  desc_concepto: '',
  desc_concepto_preventivo: '',
  precio_concepto: 0,
  capitulo: 0,
  evaluaciones: [] as EvaluacionActual[],
  // Detalles adicionales
  epis: [] as string[],
  pqs: [] as string[],
  maqs: [] as string[],
  pcols: [] as string[],
  medauxs: [] as string[]
})

// Extract error message from server response or error object
const extractErrorMessage = (error: any, defaultMessage: string = 'Error desconocido'): string => {
  if (error && typeof error === 'object') {
    // Handle FetchError from $fetch
    if ('data' in error && error.data && typeof error.data === 'object') {
      // Server returned structured error data
      if ('message' in error.data && typeof error.data.message === 'string') {
        return error.data.message
      }
    } else if ('message' in error && typeof error.message === 'string') {
      // Handle regular Error objects
      return error.message
    }
  }
  return defaultMessage
}

// Evaluaciones management functions
const addEvaluacion = () => {
  state.evaluaciones.unshift({
    gravedad: { id: 0, descripcion: '' },
    probabilidad: { id: 0, descripcion: '' },
    riesgo: { id: 0, descripcion: '' }
  })
}

const deleteEvaluacion = (index: number) => {
  state.evaluaciones.splice(index, 1)
}

// Populate form from concepto data
const populateFormFromConcepto = (concepto: any) => {
  console.log('=== POPULATE FORM FROM CONCEPTO ===')
  console.log('Input concepto:', concepto)
  console.log('Input concepto.evaluaciones:', concepto?.evaluaciones)
  console.log('Is evaluaciones array?', Array.isArray(concepto?.evaluaciones))

  state.nom_concepto = concepto.nom_concepto || ''
  state.desc_concepto = concepto.desc_concepto || ''
  state.desc_concepto_preventivo = concepto.desc_concepto_preventivo || ''
  state.precio_concepto = concepto.precio_concepto || 0
  state.capitulo = concepto.capitulo || 1

  // Handle evaluaciones with proper structure validation
  if (concepto.evaluaciones && Array.isArray(concepto.evaluaciones)) {
    console.log('Processing evaluaciones array with', concepto.evaluaciones.length, 'items')
    state.evaluaciones = concepto.evaluaciones.map((evaluacion: any) => {
      console.log('Processing evaluacion:', evaluacion)
      return {
        riesgo: evaluacion.riesgo || { id: 0, descripcion: '' },
        probabilidad: evaluacion.probabilidad || { id: 0, descripcion: '' },
        gravedad: evaluacion.gravedad || { id: 0, descripcion: '' }
      }
    })
  } else {
    console.log('No evaluaciones found or not an array, setting empty array')
    state.evaluaciones = []
  }

  // Handle detalles adicionales
  state.epis = Array.isArray(concepto.epis) ? [...concepto.epis] : []
  state.pqs = Array.isArray(concepto.pqs) ? [...concepto.pqs] : []
  state.maqs = Array.isArray(concepto.maqs) ? [...concepto.maqs] : []
  state.pcols = Array.isArray(concepto.pcols) ? [...concepto.pcols] : []
  state.medauxs = Array.isArray(concepto.medauxs) ? [...concepto.medauxs] : []

  console.log('Final state.evaluaciones:', state.evaluaciones)
  console.log('Final state.evaluaciones.length:', state.evaluaciones.length)
  console.log('Final state detalles adicionales:', {
    epis: state.epis.length,
    pqs: state.pqs.length,
    maqs: state.maqs.length,
    pcols: state.pcols.length,
    medauxs: state.medauxs.length
  })
}

// Watch for concepto changes to populate form - DISABLED to avoid conflicts
// The modal opening watcher handles data loading instead
/*
watch(() => props.concepto, async (newConcepto) => {
  if (newConcepto) {
    if (props.isEdit) {
      // For edit, use the concepto data directly since MiniConcepto has all needed fields
      populateFormFromConcepto(newConcepto);
    } else {
      // For copy, use the concepto data and modify the name
      populateFormFromConcepto(newConcepto);
      state.nom_concepto = `Copia de ${newConcepto.nom_concepto}`;
    }
  }
}, { immediate: true });
*/

// Load full concepto data for editing
const loadFullConcepto = async (conceptoId: string) => {
  try {
    isLoading.value = true
    await conceptoStore.loadConceptoActual(conceptoId)
    populateFormFromConcepto(conceptoStore.conceptoActual)
  } catch (error) {
    console.error('Error loading concepto:', error)
    toast.add({
      title: 'Error',
      description: 'No se pudo cargar el concepto',
      icon: 'i-heroicons-exclamation-circle',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Handle form submission
const onSubmit = async (event: FormSubmitEvent<z.infer<typeof schemaConcepto>>) => {
  console.log('Form submitted - isEdit:', props.isEdit, 'concepto:', props.concepto)

  if (props.isEdit) {
    // For editing, show scope selection dialog
    showScopeDialog.value = true
  } else {
    // For copying, always create new concepto
    await saveAsNewConcepto()
  }
}

// Save as new concepto (for copying)
const saveAsNewConcepto = async () => {
  try {
    isLoading.value = true
    console.log('Starting copy save with state:', state)

    // Use the store's copy method (now that we fixed the typo)
    // Create a concepto object with the original ID for the store to load
    const conceptoToCopy = {
      _id: (props.concepto as any)?._id || props.concepto?.id,
      nom_concepto: state.nom_concepto, // This will be overridden by the store with "Copia" prefix
      desc_concepto: state.desc_concepto,
      desc_concepto_preventivo: state.desc_concepto_preventivo,
      precio_concepto: state.precio_concepto,
      capitulo: state.capitulo
    }

    console.log('Using store copy method with concepto:', conceptoToCopy)
    await conceptoStore.copyConcepto(conceptoToCopy as any)

    // Reload the capitulo to show the new copied concepto
    console.log('Reloading capitulo:', state.capitulo)
    await conceptoStore.getConceptosdeCapitulo(state.capitulo)

    toast.add({
      title: 'Éxito',
      description: 'Concepto copiado correctamente',
      icon: 'i-heroicons-check-circle',
      color: 'success'
    })

    emit('saved', state)
    closeModal()
  } catch (error) {
    console.error('Error copying concepto:', error)

    const errorMessage = extractErrorMessage(error, 'Ha ocurrido un error al copiar el concepto')
    console.error('Extracted error message:', errorMessage)

    toast.add({
      title: 'Error al copiar concepto',
      description: errorMessage,
      icon: 'i-heroicons-exclamation-circle',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Save to conceptos database (permanent)
const savePermanentConcepto = async () => {
  // For editing existing concepto, use PATCH. For copying, always use POST (create new)
  const isUpdating = props.isEdit
  const conceptoId = (props.concepto as any)?._id || props.concepto?.id

  const method = isUpdating ? 'PATCH' : 'POST'
  const url = isUpdating ? `/api/conceptos/${conceptoId}` : '/api/conceptos'

  // Create a complete concepto object structure like the store does
  const body: any = {
    // Form data
    nom_concepto: state.nom_concepto,
    desc_concepto: state.desc_concepto,
    desc_concepto_preventivo: state.desc_concepto_preventivo,
    precio_concepto: state.precio_concepto,
    capitulo: state.capitulo,

    // User data
    emailuser: userStore.user.email,
    mguser: userStore.user._id,
    mgroluser: (userStore.user as any).mgroluser || 'admin',

    // Access token in body
    accessToken: userStore.getAccessToken,

    // Required arrays
    evaluaciones: state.evaluaciones,
    epis: state.epis,
    pqs: state.pqs,
    maqs: state.maqs,
    pcols: state.pcols,
    medauxs: state.medauxs,

    // Default tipo_concepto_unidad
    tipo_concepto_unidad: { id: 1, descripcion: 'ud' }
  }

  // Only include _id for updates, never for copies
  if (isUpdating && conceptoId) {
    body._id = conceptoId
  }

  // For copies, ensure we don't include any ID
  if (!isUpdating) {
    delete body._id
    delete body.id
  }

  console.log('Making API call:', { method, url })
  console.log('Request body:', JSON.stringify(body, null, 2))

  const response = await $fetch(url, {
    method,
    body
  })

  console.log('API response:', response)
  return response
}

// Save to plan only (local modifications)
const savePlanOnlyConcepto = async () => {
  const conceptoId = (props.concepto as any)?._id || props.concepto?.id
  if (!conceptoId) {
    throw new Error('No se pudo obtener el ID del concepto')
  }

  // Create the modified concepto data
  const modifiedConcepto = {
    _id: conceptoId,
    nom_concepto: state.nom_concepto,
    desc_concepto: state.desc_concepto,
    desc_concepto_preventivo: state.desc_concepto_preventivo,
    precio_concepto: state.precio_concepto,
    capitulo: state.capitulo,
    evaluaciones: state.evaluaciones,
    epis: state.epis,
    pqs: state.pqs,
    maqs: state.maqs,
    pcols: state.pcols,
    medauxs: state.medauxs
  }

  // Store in plan's local modifications
  if (!planesStore.planActual.localConceptoModifications) {
    planesStore.planActual.localConceptoModifications = {}
  }
  planesStore.planActual.localConceptoModifications[conceptoId] = modifiedConcepto

  console.log('Saved concepto to plan local modifications:', modifiedConcepto)
}

// Modal state management
const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// Close modal
const closeModal = () => {
  emit('update:modelValue', false)
  showScopeDialog.value = false
  resetForm()
}

// Reset form to initial state
const resetForm = () => {
  state.nom_concepto = ''
  state.desc_concepto = ''
  state.desc_concepto_preventivo = ''
  state.precio_concepto = 0
  state.capitulo = 0
  state.evaluaciones = []
  state.epis = []
  state.pqs = []
  state.maqs = []
  state.pcols = []
  state.medauxs = []
}

// Handle scope dialog
const cancelScopeDialog = () => {
  showScopeDialog.value = false
  isLoading.value = false
}

const handleSave = async () => {
  try {
    if (saveScope.value === 'permanent') {
      await savePermanentConcepto()
    } else {
      await savePlanOnlyConcepto()
    }

    showScopeDialog.value = false

    toast.add({
      title: 'Éxito',
      description: 'Concepto actualizado correctamente',
      icon: 'i-heroicons-check-circle',
      color: 'success'
    })

    emit('saved', state)
    closeModal()
  } catch (error) {
    console.error('Error saving concepto:', error)

    const errorMessage = extractErrorMessage(error, 'Ha ocurrido un error al guardar el concepto')

    toast.add({
      title: 'Error al guardar concepto',
      description: errorMessage,
      icon: 'i-heroicons-exclamation-circle',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Watch for modal opening to load data
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.concepto) {
    try {
      isLoading.value = true

      // Load master tables if needed
      await Promise.all([
        conceptoStore.riesgos.length === 0 ? conceptoStore.getRiesgos() : Promise.resolve(),
        conceptoStore.probabilidad.length === 0 ? conceptoStore.getProbabilidad() : Promise.resolve(),
        conceptoStore.gravedad.length === 0 ? conceptoStore.getGravedad() : Promise.resolve(),
        conceptoStore.epis.length === 0 ? conceptoStore.getEpis() : Promise.resolve(),
        conceptoStore.pqs.length === 0 ? conceptoStore.getPqs() : Promise.resolve(),
        conceptoStore.maqs.length === 0 ? conceptoStore.getMaqs() : Promise.resolve(),
        conceptoStore.pcols.length === 0 ? conceptoStore.getPcols() : Promise.resolve(),
        conceptoStore.medauxs.length === 0 ? conceptoStore.getMedauxs() : Promise.resolve()
      ])

      // Load full concepto data if we have an ID
      const conceptoId = (props.concepto as any)?._id || props.concepto?.id
      if (conceptoId) {
        console.log('Loading full concepto data for ID:', conceptoId)
        const response = await conceptoStore.loadConceptoActual(conceptoId)
        if (response && conceptoStore.conceptoActual) {
          populateFormFromConcepto(conceptoStore.conceptoActual)
        } else {
          // Fallback to the concepto data we have
          populateFormFromConcepto(props.concepto)
        }
      } else {
        // No ID available, use the concepto data we have
        populateFormFromConcepto(props.concepto)
      }
    } catch (error) {
      console.error('Error loading concepto data:', error)
      toast.add({
        title: 'Error',
        description: 'No se pudo cargar el concepto',
        icon: 'i-heroicons-exclamation-circle',
        color: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }
})
</script>

<template>
  <div>
    <!-- Main Edit Modal -->
    <UModal
      v-model:open="isModalOpen"
      fullscreen
      :title="isEdit ? 'Editar Concepto' : 'Crear Concepto'"
      :description="isEdit ? 'Modifica los datos del concepto existente' : 'Crea un concepto con nuevos datos'"
    >
      <UButton
        label="Open"
        color="neutral"
        variant="subtle"
        style="display: none;"
      />

      <template #title>
        <!-- <div class="p-6 max-h-[95vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-2"> -->

        <h3 class="text-lg font-semibold">
          <UIcon
            :name="isEdit ? 'i-heroicons-pencil' : 'i-heroicons-document-duplicate'"
            class="w-5 h-5 text-primary-500"
          />
          {{ isEdit ? 'Editar' : 'Crear' }} Concepto
        </h3>
        <!-- </div> -->
        <!-- <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm" @click="closeModal"
              :disabled="isLoading" /> -->
        <!-- </div>
        </div> -->
      </template>
      <template #body>
        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-6 pt-4">
          <UForm
            :schema="schemaConcepto"
            :state="state"
            class="space-y-6"
            @submit="onSubmit"
          >
            <!-- Información Básica -->
            <UCard class="overflow-hidden">
              <template #header>
                <div class="flex items-center space-x-2">
                  <UIcon
                    name="i-heroicons-document-text"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Información Básica
                  </h2>
                </div>
              </template>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField
                  label="Nombre del Concepto"
                  name="nom_concepto"
                  required
                  help="Nombre descriptivo del concepto"
                  class="md:col-span-2"
                >
                  <UInput
                    v-model="state.nom_concepto"
                    placeholder="Ej: Instalación eléctrica"
                    :disabled="isLoading"
                    size="lg"
                    icon="i-heroicons-tag"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Capítulo"
                  name="capitulo"
                  help="Número del capítulo al que pertenece"
                >
                  <UInput
                    v-model.number="state.capitulo"
                    type="number"
                    min="1"
                    max="31"
                    :disabled="isLoading"
                    placeholder="1"
                    icon="i-heroicons-folder"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Precio (€)"
                  name="precio_concepto"
                  help="Precio unitario del concepto"
                >
                  <UInput
                    v-model.number="state.precio_concepto"
                    type="number"
                    step="0.01"
                    min="0"
                    :disabled="isLoading"
                    placeholder="0.00"
                    icon="i-heroicons-currency-euro"
                    class="w-full"
                  >
                    <template #trailing>
                      <span class="text-gray-500 dark:text-gray-400 text-sm">
                        EUR
                      </span>
                    </template>
                  </UInput>
                </UFormField>
              </div>
            </UCard>

            <!-- Descripciones -->
            <UCard class="overflow-hidden">
              <template #header>
                <div class="flex items-center space-x-2">
                  <UIcon
                    name="i-heroicons-document-text"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Descripciones
                  </h2>
                </div>
              </template>

              <div class="space-y-6">
                <UFormField
                  label="Descripción del concepto"
                  name="desc_concepto"
                  class="w-full"
                >
                  <UTextarea
                    v-model="state.desc_concepto"
                    :rows="4"
                    :disabled="isLoading"
                    placeholder="Describe el concepto con detalle..."
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Descripción Concepto Preventivo"
                  name="desc_concepto_preventivo"
                  class="w-full"
                >
                  <UTextarea
                    v-model="state.desc_concepto_preventivo"
                    :rows="4"
                    :disabled="isLoading"
                    placeholder="Incluye información preventiva relevante..."
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <!-- Evaluaciones -->
            <UCard class="overflow-hidden">
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <UIcon
                      name="i-heroicons-shield-check"
                      class="w-5 h-5 text-primary-500"
                    />
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Evaluaciones
                    </h2>
                  </div>
                  <div class="flex-shrink-0">
                    <p class="text-xs text-gray-500">
                      Debug: {{ state.evaluaciones.length }} items loaded
                    </p>
                  </div>
                  <UButton
                    icon="i-heroicons-plus"
                    size="sm"
                    color="primary"
                    variant="solid"
                    :disabled="isLoading"
                    @click="addEvaluacion"
                  >
                    Nueva Evaluación
                  </UButton>
                </div>
              </template>

              <div class="space-y-4">
                <div
                  v-for="(evaluacion, index) in state.evaluaciones"
                  :key="index"
                  class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <UFormField
                      label="Riesgo"
                      :required="true"
                    >
                      <USelectMenu
                        v-model="evaluacion.riesgo"
                        :items="conceptoStore.riesgos"
                        label-key="descripcion"
                        :disabled="isLoading"
                        placeholder="Seleccionar riesgo"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Probabilidad"
                      :required="true"
                    >
                      <USelectMenu
                        v-model="evaluacion.probabilidad"
                        :items="conceptoStore.probabilidad"
                        label-key="descripcion"
                        :disabled="isLoading"
                        placeholder="Seleccionar probabilidad"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      label="Gravedad"
                      :required="true"
                    >
                      <USelectMenu
                        v-model="evaluacion.gravedad"
                        :items="conceptoStore.gravedad"
                        label-key="descripcion"
                        :disabled="isLoading"
                        placeholder="Seleccionar gravedad"
                        class="w-full"
                      />
                    </UFormField>

                    <div class="flex justify-end">
                      <UButton
                        icon="i-heroicons-trash"
                        size="sm"
                        color="error"
                        variant="ghost"
                        :disabled="isLoading"
                        @click="deleteEvaluacion(index)"
                      >
                        Eliminar
                      </UButton>
                    </div>
                  </div>
                </div>

                <div
                  v-if="state.evaluaciones.length === 0"
                  class="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  <UIcon
                    name="i-heroicons-shield-exclamation"
                    class="w-8 h-8 mx-auto mb-2 opacity-50"
                  />
                  <p>No hay evaluaciones definidas</p>
                  <p class="text-sm">
                    Haz clic en "Nueva Evaluación" para agregar una
                  </p>
                  <p class="text-xs mt-2 text-red-500">
                    Debug: {{ state.evaluaciones.length }} evaluaciones en state
                  </p>
                </div>
              </div>
            </UCard>

            <!-- Detalles adicionales -->
            <UCard class="overflow-hidden">
              <template #header>
                <div class="flex items-center space-x-2">
                  <UIcon
                    name="i-heroicons-document-text"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Detalles adicionales
                  </h2>
                </div>
              </template>

              <div class="space-y-6">
                <UFormField
                  label="EPIS"
                  name="epis"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="state.epis"
                    :items="conceptoStore.epis"
                    option-attribute="descripcion"
                    multiple
                    :disabled="isLoading"
                    placeholder="Seleccionar EPIS"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="PQS"
                  name="pqs"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="state.pqs"
                    :items="conceptoStore.pqs"
                    option-attribute="descripcion"
                    multiple
                    :disabled="isLoading"
                    placeholder="Seleccionar PQS"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="MAQS"
                  name="maqs"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="state.maqs"
                    :items="conceptoStore.maqs"
                    option-attribute="descripcion"
                    multiple
                    :disabled="isLoading"
                    placeholder="Seleccionar MAQS"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="PCOLS"
                  name="pcols"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="state.pcols"
                    :items="conceptoStore.pcols"
                    option-attribute="descripcion"
                    multiple
                    :disabled="isLoading"
                    placeholder="Seleccionar PCOLS"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="MEDAUXS"
                  name="medauxs"
                  class="w-full"
                >
                  <USelectMenu
                    v-model="state.medauxs"
                    :items="conceptoStore.medauxs"
                    option-attribute="descripcion"
                    multiple
                    :disabled="isLoading"
                    placeholder="Seleccionar MEDAUXS"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="isLoading"
                @click="closeModal"
              >
                Cancelar
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="isLoading"
                :disabled="isLoading"
                :icon="isEdit ? 'i-heroicons-pencil' : 'i-heroicons-document-duplicate'"
              >
                {{ isEdit ? 'Guardar Cambios' : 'Crear Copia' }}
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>

    <!-- Scope Selection Dialog -->
    <UModal
      v-model:open="showScopeDialog"
      title="Alcance de los Cambios"
      description="Selecciona dónde quieres aplicar las modificaciones del concepto"
    >
      <UButton
        label="Open"
        color="neutral"
        variant="subtle"
        style="display: none;"
      />

      <template #content>
        <div class="p-6">
          <div class="flex items-center space-x-2 mb-4">
            <UIcon
              name="i-heroicons-question-mark-circle"
              class="w-5 h-5 text-primary-500"
            />
            <h3 class="text-lg font-semibold">
              Alcance de los Cambios
            </h3>
          </div>

          <div class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              ¿Dónde quieres aplicar estos cambios?
            </p>

            <URadioGroup
              v-model="saveScope"
              :options="[
                {
                  value: 'plan',
                  label: 'Solo en este plan',
                  help: 'Los cambios solo afectarán a este plan específico'
                },
                {
                  value: 'permanent',
                  label: 'Cambio permanente',
                  help: 'Los cambios se guardarán en la base de datos de conceptos'
                }
              ]"
              class="space-y-3"
            />
          </div>

          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isLoading"
              @click="cancelScopeDialog"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              :loading="isLoading"
              :disabled="isLoading"
              @click="handleSave"
            >
              Confirmar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
