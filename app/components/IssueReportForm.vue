<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">
            Formulario de Reporte
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Paso {{ currentStep }} de {{ totalSteps }}
          </p>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="$emit('cancel')"
        >
          Cancelar
        </UButton>
      </div>
    </template>

    <!-- Step Indicator -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.length - 1 }"
        >
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors"
            :class="{
              'bg-primary text-white': index + 1 === currentStep,
              'bg-green-500 text-white': index + 1 < currentStep,
              'bg-gray-200 dark:bg-gray-700 text-gray-500': index + 1 > currentStep
            }"
          >
            <UIcon
              v-if="index + 1 < currentStep"
              name="i-heroicons-check"
              class="w-4 h-4"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            v-if="index < steps.length - 1"
            class="flex-1 h-1 mx-2 transition-colors"
            :class="{
              'bg-green-500': index + 1 < currentStep,
              'bg-gray-200 dark:bg-gray-700': index + 1 >= currentStep
            }"
          />
        </div>
      </div>
      <div class="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span
          v-for="(step, index) in steps"
          :key="index"
          class="flex-1 text-center"
        >
          {{ step.label }}
        </span>
      </div>
    </div>

    <!-- Form Steps -->
    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Personal Info -->
      <div
        v-if="currentStep === 1"
        class="space-y-4"
      >
        <UFormField
          label="Nombre completo"
          name="reporterName"
          required
        >
          <UInput
            v-model="formData.reporterName"
            placeholder="Tu nombre completo"
            size="lg"
            :disabled="submitting"
          />
          <template
            v-if="formData.reporterName && formData.reporterName.length < 2"
            #error
          >
            Nombre debe tener al menos 2 caracteres
          </template>
        </UFormField>

        <UFormField
          label="Email"
          name="reporterEmail"
          required
        >
          <UInput
            v-model="formData.reporterEmail"
            type="email"
            placeholder="tu@email.com"
            size="lg"
            :disabled="submitting"
            :color="formData.reporterEmail && !isValidEmail ? 'error' : undefined"
          />
          <template
            v-if="formData.reporterEmail && !isValidEmail"
            #error
          >
            Formato de email inválido
          </template>
        </UFormField>

        <UFormField
          label="Teléfono (opcional)"
          name="reporterPhone"
        >
          <UInput
            v-model="formData.reporterPhone"
            placeholder="+34 612 345 678"
            size="lg"
            :disabled="submitting"
          />
          <template
            v-if="formData.reporterPhone && !isValidPhone"
            #error
          >
            Formato de teléfono inválido (ej: +34 612 345 678)
          </template>
        </UFormField>

        <!-- Validation status -->
        <div class="flex items-center gap-2 text-sm">
          <UIcon
            v-if="isStep1Valid"
            name="i-heroicons-check-circle"
            class="w-5 h-5 text-green-500"
          />
          <UIcon
            v-else
            name="i-heroicons-x-circle"
            class="w-5 h-5 text-red-500"
          />
          <span :class="isStep1Valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ isStep1Valid ? 'Información personal válida' : 'Completa los campos requeridos correctamente' }}
          </span>
        </div>
      </div>

      <!-- Step 2: Issue Details -->
      <div
        v-if="currentStep === 2"
        class="space-y-4"
      >
        <UFormField
          label="Título del problema"
          name="title"
          required
        >
          <UInput
            v-model="formData.title"
            placeholder="Breve descripción del problema (mínimo 5 caracteres)"
            size="lg"
            :disabled="submitting"
            :color="formData.title && !isValidTitle ? 'error' : undefined"
          />
          <template
            v-if="formData.title && !isValidTitle"
            #error
          >
            Título debe tener al menos 5 caracteres
          </template>
        </UFormField>

        <UFormField
          label="Descripción detallada"
          name="description"
          required
        >
          <UTextarea
            v-model="formData.description"
            placeholder="Describe el problema en detalle (mínimo 20 caracteres)"
            :rows="5"
            size="lg"
            :disabled="submitting"
            :color="formData.description && !isValidDescription ? 'error' : undefined"
          />
          <template
            v-if="formData.description && !isValidDescription"
            #error
          >
            Descripción debe tener al menos 20 caracteres
          </template>
        </UFormField>

        <UFormField
          label="Tipo de problema"
          name="type"
          required
        >
          <USelect
            v-model="formData.type"
            :items="typeOptions"
            placeholder="Selecciona el tipo de problema"
            size="lg"
            :disabled="submitting"
            :color="formData.type && !hasType ? 'error' : undefined"
          />
        </UFormField>

        <UFormField
          label="Prioridad"
          name="priority"
          required
        >
          <USelect
            v-model="formData.priority"
            :items="priorityOptions"
            placeholder="Selecciona la prioridad"
            size="lg"
            :disabled="submitting"
            :color="formData.priority && !hasPriority ? 'error' : undefined"
          />
        </UFormField>

        <!-- Validation status -->
        <div class="flex items-center gap-2 text-sm">
          <UIcon
            v-if="isStep2Valid"
            name="i-heroicons-check-circle"
            class="w-5 h-5 text-green-500"
          />
          <UIcon
            v-else
            name="i-heroicons-x-circle"
            class="w-5 h-5 text-red-500"
          />
          <span :class="isStep2Valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ isStep2Valid ? 'Detalles del problema completados' : 'Completa todos los campos requeridos' }}
          </span>
        </div>
      </div>

      <!-- Step 3: Photo Upload -->
      <div
        v-if="currentStep === 3"
        class="space-y-4"
      >
        <UFormField
          label="Fotos (opcional)"
          name="photos"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Puedes subir hasta 10 fotos para documentar el problema
          </p>

          <!-- Upload Button -->
          <div class="flex items-center gap-2 mb-4">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              :disabled="submitting || uploadingPhoto"
              @change="handleFileSelect"
            >
            <UButton
              icon="i-heroicons-camera"
              color="primary"
              :loading="uploadingPhoto"
              :disabled="submitting || (formData.photos?.length ?? 0) >= 10"
              @click="triggerFileInput"
            >
              Subir fotos
            </UButton>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ formData.photos?.length ?? 0 }} / 10 fotos
            </span>
          </div>

          <!-- Photo Previews -->
          <div
            v-if="formData.photos && formData.photos.length > 0"
            class="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            <div
              v-for="(photo, index) in formData.photos"
              :key="photo.id"
              class="relative group"
            >
              <img
                :src="photo.url"
                :alt="`Foto ${index + 1}`"
                crossorigin="anonymous"
                class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              >
              <UButton
                icon="i-heroicons-x-mark"
                color="error"
                size="sm"
                variant="solid"
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                @click="removePhoto(index)"
              />
            </div>
          </div>
        </UFormField>
      </div>

      <!-- Step 4: Location -->
      <div
        v-if="currentStep === 4"
        class="space-y-4"
      >
        <UFormField
          label="Edificio (opcional)"
          name="building"
        >
          <UInput
            v-model="formData.location.building"
            placeholder="Nombre del edificio"
            size="lg"
            :disabled="submitting"
          />
        </UFormField>

        <UFormField
          label="Piso (opcional)"
          name="floor"
        >
          <UInput
            v-model="formData.location.floor"
            placeholder="Número o nombre del piso"
            size="lg"
            :disabled="submitting"
          />
        </UFormField>

        <UFormField
          label="Área (opcional)"
          name="area"
        >
          <UInput
            v-model="formData.location.area"
            placeholder="Descripción del área específica"
            size="lg"
            :disabled="submitting"
          />
        </UFormField>

        <UAlert
          icon="i-heroicons-information-circle"
          color="info"
          variant="soft"
          title="Información de ubicación"
          description="Esta información ayuda a los coordinadores a localizar el problema rápidamente."
        />
      </div>

      <!-- Step 5: Verification -->
      <div
        v-if="currentStep === 5"
        class="space-y-6"
      >
        <UAlert
          icon="i-heroicons-information-circle"
          color="neutral"
          variant="soft"
          title="Verificación opcional"
          description="Puedes enviar el reporte sin verificar tu identidad. La verificación ayuda a prevenir reportes falsos."
        />

        <VerificationForm
          :obra-id="planData._id"
          :email="formData.reporterEmail"
          :phone="formData.reporterPhone"
          @verified="handleVerificationVerified"
          @error="handleVerificationError"
        />

        <!-- Verification Status Badge -->
        <div
          v-if="verificationVerified"
          class="flex items-center gap-2"
        >
          <UIcon
            name="i-heroicons-check-circle"
            class="w-5 h-5 text-green-500"
          />
          <span class="text-sm font-medium text-green-600 dark:text-green-400">
            Identidad verificada
          </span>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between mt-6">
        <UButton
          v-if="currentStep > 1"
          icon="i-heroicons-arrow-left"
          variant="outline"
          :disabled="submitting"
          @click="previousStep"
        >
          Anterior
        </UButton>

        <div class="flex gap-2 ml-auto">
          <UButton
            v-if="currentStep < totalSteps"
            icon="i-heroicons-arrow-right"
            color="primary"
            :loading="submitting"
            :disabled="!canProceed"
            @click="nextStep"
          >
            Siguiente
          </UButton>
          <UButton
            v-else
            icon="i-heroicons-paper-airplane"
            color="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            type="submit"
          >
            Enviar reporte
          </UButton>
        </div>
      </div>
    </form>
  </UCard>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { IssueReportSubmitSchema, ISSUE_TYPES, ISSUE_PRIORITIES } from '../schemas/issue-reporting'
import type { IssueLocation, PhotoUpload } from '../types/issue-reporting'
import VerificationForm from './VerificationForm.vue'

/**
 * IssueReportForm Component
 *
 * Multi-step form for public issue reporting with:
 * - Personal info (name, email, phone)
 * - Issue details (title, description, type, priority)
 * - Photo upload (up to 10 photos)
 * - Location (building, floor, area - optional)
 * - Verification (6-digit code)
 *
 * @props {Object} planData - Plan information (nom_obra, obraId)
 * @props {string} qrSlug - QR slug for API calls (public access - no token needed)
 * @emits {Object} submit - Emitted when form is submitted with formData
 * @emits {string} cancel - Emitted if user wants to cancel
 */

interface Props {
  planData: {
    _id: string
    nom_obra: string
  }
  qrSlug: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [formData: any]
  cancel: []
}>()

// Composables
const { uploadFile } = useS3()
const toast = useToast()

// Form state
const currentStep = ref(1)
const totalSteps = 5
const submitting = ref(false)
const uploadingPhoto = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Verification state
const verificationVerified = ref(false)
const verificationError = ref<string | null>(null)

// Form data
const formData = ref<{
  reporterName: string
  reporterEmail: string
  reporterPhone: string
  title: string
  description: string
  type: string
  priority: string
  photos: PhotoUpload[]
  location: IssueLocation
  verificationCode: string
}>({
  reporterName: '',
  reporterEmail: '',
  reporterPhone: '',
  title: '',
  description: '',
  type: '',
  priority: '',
  photos: [],
  location: {},
  verificationCode: ''
})

// Step definitions
const steps = [
  { label: 'Personal', key: 'personal' },
  { label: 'Detalles', key: 'details' },
  { label: 'Fotos', key: 'photos' },
  { label: 'Ubicación', key: 'location' },
  { label: 'Verificar (opcional)', key: 'verification' }
]

// Type options
const typeOptions = ISSUE_TYPES.map(type => ({
  label: type === 'annotation' ? 'Anotación' : type === 'comment' ? 'Comentario' : 'Accidente',
  value: type
}))

// Priority options
const priorityOptions = ISSUE_PRIORITIES.map(priority => ({
  label: priority === 'low' ? 'Baja' : priority === 'medium' ? 'Media' : priority === 'high' ? 'Alta' : 'Crítica',
  value: priority
}))

// Validation for each step
const stepValidation = {
  1: z.object({
    reporterName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    reporterEmail: z.string().email('Formato de email inválido'),
    reporterPhone: z.string().regex(/^[+]?[\d\s-]{9,15}$/, 'Formato de teléfono inválido').optional().or(z.literal(''))
  }),
  2: z.object({
    title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
    description: z.string().min(20, 'Descripción debe tener al menos 20 caracteres'),
    type: z.enum(ISSUE_TYPES, { errorMap: () => ({ message: 'Selecciona un tipo de problema' }) }),
    priority: z.enum(ISSUE_PRIORITIES, { errorMap: () => ({ message: 'Selecciona una prioridad' }) })
  }),
  3: z.object({
    photos: z.array(z.any()).max(10, 'Máximo 10 fotos permitidas').optional()
  }),
  4: z.object({
    location: z.object({
      building: z.string().max(100).optional(),
      floor: z.string().max(50).optional(),
      area: z.string().max(100).optional()
    })
  }),
  5: z.object({
    // Verification is completely optional - handled by VerificationForm component
    // No validation required at form level
  }).passthrough()
}

// Helper function to get Zod error message
function getZodErrorMessage(error: any): string {
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0]
    return firstError.message || 'Error de validación'
  }
  return error.message || 'Error de validación'
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Computed validation properties
const isValidName = computed(() => formData.value.reporterName.length >= 2)

const isValidEmail = computed(() => {
  const email = formData.value.reporterEmail.trim()
  return email.length > 0 && emailRegex.test(email)
})

const isValidPhone = computed(() => {
  const phone = formData.value.reporterPhone.trim()
  return phone.length === 0 || /^[+]?[\d\s-]{9,15}$/.test(phone)
})

const isStep1Valid = computed(() => isValidName.value && isValidEmail.value)

const isValidTitle = computed(() => formData.value.title.length >= 5)

const isValidDescription = computed(() => formData.value.description.length >= 20)

const hasType = computed(() => formData.value.type !== '')

const hasPriority = computed(() => formData.value.priority !== '')

const isStep2Valid = computed(() => isValidTitle.value && isValidDescription.value && hasType.value && hasPriority.value)

// Computed
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return isStep1Valid.value
    case 2:
      return isStep2Valid.value
    case 3:
      return true // Photos are optional
    case 4:
      return true // Location is optional
    case 5:
      return true // Verification is now optional
    default:
      return false
  }
})

const canSubmit = computed(() => {
  return canProceed.value
})

// Methods
function nextStep() {
  // Validate current step with Zod
  try {
    const currentValidation = stepValidation[currentStep.value as keyof typeof stepValidation]

    // Prepare data for validation
    const dataToValidate = {
      reporterName: formData.value.reporterName,
      reporterEmail: formData.value.reporterEmail,
      reporterPhone: formData.value.reporterPhone || undefined,
      title: formData.value.title,
      description: formData.value.description,
      type: formData.value.type,
      priority: formData.value.priority,
      photos: formData.value.photos,
      location: formData.value.location,
      verificationCode: formData.value.verificationCode || undefined
    }

    // Parse with Zod - will throw if invalid
    currentValidation.parse(dataToValidate)

    // If validation passes, move to next step
    currentStep.value++
  } catch (error: any) {
    console.error('Step validation error:', error)
    toast.add({
      title: 'Error de validación',
      description: getZodErrorMessage(error),
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function handleSubmit() {
  // Validate all data with Zod schema
  try {
    submitting.value = true

    const submitData = {
      reporterName: formData.value.reporterName,
      reporterEmail: formData.value.reporterEmail,
      reporterPhone: formData.value.reporterPhone,
      title: formData.value.title,
      description: formData.value.description,
      type: formData.value.type,
      priority: formData.value.priority,
      photos: formData.value.photos,
      location: formData.value.location,
      verificationCode: formData.value.verificationCode || undefined, // Use undefined if empty
      verified: verificationVerified.value // Include verification status
    }

    // Validate with full schema (verificationCode is now optional)
    IssueReportSubmitSchema.parse({
      ...submitData,
      qrSlug: props.qrSlug
    })

    // Emit submit event
    emit('submit', submitData)
  } catch (error: any) {
    console.error('Form validation error:', error)

    // Get specific error message from Zod
    const errorMessage = getZodErrorMessage(error)

    toast.add({
      title: 'Error de validación',
      description: errorMessage,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    submitting.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  // Check if adding photos would exceed limit
  const currentPhotoCount = formData.value.photos?.length ?? 0
  if (currentPhotoCount + files.length > 10) {
    toast.add({
      title: 'Demasiadas fotos',
      description: 'Solo puedes subir un máximo de 10 fotos',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }

  uploadingPhoto.value = true

  try {
    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.add({
          title: 'Archivo inválido',
          description: `${file.name} no es una imagen`,
          color: 'error',
          icon: 'i-heroicons-exclamation-triangle'
        })
        continue
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.add({
          title: 'Archivo muy grande',
          description: `${file.name} excede el límite de 10MB`,
          color: 'error',
          icon: 'i-heroicons-exclamation-triangle'
        })
        continue
      }

      // Upload to S3 using public endpoint (no authentication required)
      const uploaded = await uploadFile(file, {
        public: true, // Use public endpoint for anonymous uploads
        metadata: {
          obraId: props.planData._id // Trace uploads to specific construction projects
        }
      })

      // Add to photos array
      if (!formData.value.photos) {
        formData.value.photos = []
      }

      formData.value.photos.push({
        id: uploaded.key,
        url: uploaded.url,
        caption: ''
      })
    }

    toast.add({
      title: 'Fotos subidas',
      description: `${files.length} foto(s) subida(s) correctamente`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  } catch (error: any) {
    console.error('Error uploading photos:', error)
    toast.add({
      title: 'Error al subir fotos',
      description: error.message || 'No se pudieron subir las fotos',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    uploadingPhoto.value = false
    // Reset file input
    if (target) {
      target.value = ''
    }
  }
}

function removePhoto(index: number) {
  if (formData.value.photos) {
    formData.value.photos.splice(index, 1)
  }
}

/**
 * Handle verification success from VerificationForm component
 */
function handleVerificationVerified() {
  verificationVerified.value = true
  verificationError.value = null
}

/**
 * Handle verification error from VerificationForm component
 */
function handleVerificationError(message: string) {
  verificationError.value = message
  verificationVerified.value = false
}
</script>
