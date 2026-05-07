<template>
  <UModal
    fullscreen
    :open="open"
    :title="title"
    :close="{ onClick: () => emit('close', null) }"
    style="z-index: 9999;"
    @after:leave="emit('afterLeave')"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center space-x-3">
          <UIcon
            name="i-heroicons-document-text"
            class="w-5 h-5 text-gray-500"
          />

          <h3
            id="dialog-title"
            class="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {{ title }}
          </h3>
        </div>
        <div class="flex items-center space-x-2">
          <UButton
            v-if="showSave"
            color="primary"
            variant="solid"
            size="sm"
            icon="i-heroicons-check"
            :loading="isSaving || loading"
            @click="handleSave"
          >
            Guardar
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
        </div>
      </div>
    </template>
    <template #body>
      <div
        class="h-full flex"
        aria-describedby="dialog-description"
        aria-labelledby="dialog-title"
      >
        <!-- Sidebar -->
        <div class="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-4">
          <!-- Form Section -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la plantilla
              </label>
              <UInput
                v-model="localTemplate.name"
                placeholder="Ej: Plantilla Estándar"
                size="sm"
                @update:model-value="updateTemplate('name', $event)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <UTextarea
                v-model="localTemplate.description"
                placeholder="Describe el propósito de esta plantilla"
                :rows="3"
                size="sm"
                @update:model-value="updateTemplate('description', $event)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Identificador
              </label>
              <UInput
                v-model="localTemplate.value"
                placeholder="Ej: plantilla-estandar"
                size="sm"
                @update:model-value="updateTemplate('value', $event)"
              />
            </div>

            <div class="flex items-center space-x-2">
              <USwitch
                v-model="localTemplate.isGlobal"
                @update:model-value="updateTemplate('isGlobal', $event)"
              />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Hacer plantilla global
              </label>
            </div>

            <div class="flex items-center space-x-2">
              <USwitch
                v-model="localTemplate.isDefault"
                @update:model-value="updateTemplate('isDefault', $event)"
              />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Establecer como predeterminada
              </label>
            </div>
          </div>

          <!-- FieldConfig Section Visibility -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Secciones visibles del formulario
            </h5>
            <div class="space-y-2">
              <div
                v-for="key in sectionKeys"
                :key="key"
                class="flex items-center space-x-2"
              >
                <UCheckbox
                  :model-value="isFieldEnabled(key)"
                  @update:model-value="toggleFieldConfig(key)"
                />
                <label class="text-xs text-gray-600 dark:text-gray-400">
                  {{ sectionLabels[key] }}
                </label>
              </div>
            </div>
          </div>

          <!-- Image Gallery Section -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div class="flex items-center justify-between mb-3">
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Galería de imágenes
              </h5>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-arrow-path"
                :loading="loadingImages"
                @click="loadUploadedImages"
              />
            </div>

            <div
              v-if="loadingImages"
              class="flex justify-center py-4"
            >
              <UIcon
                name="i-heroicons-arrow-path"
                class="w-4 h-4 animate-spin"
              />
            </div>

            <div
              v-else-if="uploadedImages.length === 0"
              class="text-center py-8 px-4"
            >
              <div class="flex flex-col items-center justify-center space-y-3">
                <UIcon
                  name="i-heroicons-photo"
                  class="w-12 h-12 text-gray-400"
                />
                <div class="text-center">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Galería vacía
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    No hay imágenes disponibles. Sube imágenes para incluirlas en tus plantillas.
                  </p>
                  <UButton
                    color="primary"
                    variant="solid"
                    size="xs"
                    icon="i-heroicons-arrow-up-tray"
                    @click="loadUploadedImages"
                  >
                    Cargar imágenes
                  </UButton>
                </div>
              </div>
            </div>

            <div
              v-else
              class="grid grid-cols-2 gap-2"
            >
              <div
                v-for="(image, index) in uploadedImages"
                :key="index"
                class="group relative cursor-pointer"
              >
                <img
                  :src="image.url"
                  :alt="image.name"
                  class="w-full h-16 object-cover rounded border hover:opacity-75 transition-opacity"
                  @click="insertImageMarkdown(image.url, image.name)"
                >
                <div
                  class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-opacity rounded flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <div class="text-white text-xs text-center p-1">
                    <button
                      class="block w-full mb-1 hover:bg-gray-700 rounded px-1 py-0.5"
                      @click.stop="insertImageMarkdown(image.url, image.name)"
                    >
                      Insertar
                    </button>
                    <button
                      class="block w-full hover:bg-gray-700 rounded px-1 py-0.5"
                      @click.stop="copyImageUrl(image.url, image.name)"
                    >
                      Copiar URL
                    </button>
                  </div>
                </div>
                <div
                  class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 py-0.5 truncate rounded-b"
                >
                  {{ image.name }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
          <!-- Toolbar -->
          <div class="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800">
            <div class="flex items-center justify-between">
              <h4
                id="dialog-description"
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contenido de la plantilla (Markdown)
              </h4>
              <div class="flex items-center space-x-2">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-variable"
                  @click="toggleVariables"
                >
                  Variables
                </UButton>
              </div>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 flex">
            <!-- Editor/Preview -->
            <div class="flex-1 h-full">
              <MdEditor
                ref="editorRef"
                v-model="localTemplate.content"
                language="en-US"
                :toolbars="[
                  'bold', 'italic', 'strikeThrough', '-',
                  'title', 'quote', 'unorderedList', 'orderedList', '-',
                  'link', 'image', 'table', '-',
                  'code', 'codeRow', '-',
                  'preview', 'fullscreen'
                ]"
                :preview="false"
                :footers="[]"
                class="h-full"
                style="height: 100%"
                @update:model-value="updateTemplate('content', $event)"
              />
            </div>

            <!-- Variables Panel -->
            <div
              v-if="showVariablesPanel"
              class="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col"
            >
              <!-- Variables Section -->
              <div class="p-4 pb-2">
                <h5
                  id="dialog-description"
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Variables disponibles
                </h5>
              </div>
              <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-2 text-xs">
                <div
                  v-for="variable in availableVariables"
                  :key="variable.key"
                  class="p-2 bg-white dark:bg-gray-800 rounded border cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="insertVariable(variable.key)"
                >
                  <code class="text-primary">{{ variable.key }}</code>
                  <div class="text-gray-600 dark:text-gray-400 mt-1">
                    {{ variable.description }}
                  </div>
                </div>
              </div>

              <!-- Image Gallery Section -->
              <!-- <div>
                <div class="flex items-center justify-between mb-3">
                  <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Galería de imágenes
                  </h5>
                  <UButton @click="loadUploadedImages" color="neutral" variant="ghost" size="xs"
                    icon="i-heroicons-arrow-path" :loading="loadingImages" />
                </div>

                <div v-if="loadingImages" class="flex justify-center py-4">
                  <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                </div>

                <div v-else-if="uploadedImages.length === 0" class="text-center py-8 px-4">
                  <div class="flex flex-col items-center justify-center space-y-3">
                    <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-400" />
                    <div class="text-center">
                      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Galería vacía
                      </h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        No hay imágenes disponibles. Sube imágenes para incluirlas en tus plantillas.
                      </p>
                      <UButton @click="loadUploadedImages" color="primary" variant="solid" size="xs"
                        icon="i-heroicons-arrow-up-tray">
                        Subir imágenes
                      </UButton>
                    </div>
                  </div>
                </div>

                <div v-else class="grid grid-cols-2 gap-2">
                  <div v-for="(image, index) in uploadedImages" :key="index" class="group relative cursor-pointer">
                    <img :src="image.url" :alt="image.name"
                      class="w-full h-16 object-cover rounded border hover:opacity-75 transition-opacity"
                      @click="insertImageMarkdown(image.url, image.name)" />
                    <div
                      class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-opacity rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div class="text-white text-xs text-center p-1">
                        <button @click.stop="insertImageMarkdown(image.url, image.name)"
                          class="block w-full mb-1 hover:bg-gray-700 rounded px-1 py-0.5">
                          Insertar
                        </button>
                        <button @click.stop="copyImageUrl(image.url, image.name)"
                          class="block w-full hover:bg-gray-700 rounded px-1 py-0.5">
                          Copiar URL
                        </button>
                      </div>
                    </div>
                    <div
                      class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 py-0.5 truncate rounded-b">
                      {{ image.name }}
                    </div>
                  </div>
                </div>
              </div> -->
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Image Parameters Modal -->
  <UModal
    v-model:open="showImageParamsModal"
    title="Configurar Imagen"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center space-x-3">
          <UIcon
            name="i-heroicons-photo"
            class="w-5 h-5 text-gray-500"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Configurar Imagen
          </h3>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 p-4">
        <div class="flex items-center justify-center">
          <img
            :src="currentImageParams.url"
            :alt="currentImageParams.name"
            class="max-h-40 max-w-full object-contain rounded border"
          >
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la imagen
            </label>
            <UInput
              v-model="currentImageParams.name"
              disabled
              size="sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Posición
            </label>
            <USelect
              v-model="currentImageParams.position"
              :items="[
                { value: 'left', label: 'Izquierda' },
                { value: 'center', label: 'Centro' },
                { value: 'right', label: 'Derecha' }
              ]"
              size="sm"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ancho (px)
              </label>
              <UInput
                v-model="currentImageParams.width"
                type="number"
                min="50"
                max="1000"
                placeholder="Auto"
                size="sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alto (px)
              </label>
              <UInput
                v-model="currentImageParams.height"
                type="number"
                min="50"
                max="1000"
                placeholder="Auto"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="cancelImageParams"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          @click="insertImageWithParams"
        >
          Insertar Imagen
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick, onUpdated } from 'vue'
import { MdEditor } from 'md-editor-v3'
import { renderTemplate } from '~/utils/templateRenderer'
import 'md-editor-v3/lib/style.css'
import { useTemplatesStore } from '@/stores/templates'
import { useUserStore } from '@/stores/user'
import { type TemplateFieldConfig, createFullFieldConfig } from '../../server/types/templates'

interface TemplateForm {
  name: string
  description: string
  value: string
  content: string
  isGlobal: boolean
  isDefault: boolean
  fieldConfig?: TemplateFieldConfig
}

interface Variable {
  key: string
  description: string
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  title?: string
  template?: TemplateForm
  showSave?: boolean
  showVariables?: boolean
  availableVariables?: Variable[]
  defaultContent?: string
  loading?: boolean
  open?: boolean
}>(), {
  title: 'Crear Plantilla',
  showSave: true,
  showVariables: false,
  availableVariables: () => [
    { key: 'nom_obra', description: 'Nombre de la obra' },
    { key: 'dir_obra', description: 'Dirección de la obra' },
    { key: 'poblacion_obra', description: 'Población de la obra' },
    { key: 'cp_obra', description: 'Código postal de la obra' },
    { key: 'duracion_meses', description: 'Duración en meses' },
    { key: 'presupuesto_total_obra', description: 'Presupuesto total de la obra' },
    { key: 'contratista.nom_contratista', description: 'Nombre del contratista' },
    { key: 'contratista.cif_contratista', description: 'CIF del contratista' },
    { key: 'nom_promotor', description: 'Nombre del promotor' },
    { key: 'desc_obra', description: 'Descripción de la obra' },
    { key: 'desc_condiciones_obra', description: 'Condiciones de la obra' }
  ],
  defaultContent: `# Plan de Seguridad y Salud

## {{nom_obra}}

**Dirección:** {{dir_obra}}, {{poblacion_obra}} ({{cp_obra}})
**Duración:** {{duracion_meses}} meses
**Presupuesto Total:** €{{presupuesto_total_obra}}

### Contratista
- **Empresa:** {{contratista.nom_contratista}}
- **CIF:** {{contratista.cif_contratista}}
- **Dirección:** {{contratista.dir_contratista}}

### Promotor
- **Nombre:** {{nom_promotor}}
- **CIF:** {{cif_promotor}}
- **Dirección:** {{dir_promotor}}

### Descripción de la Obra
{{desc_obra}}

### Condiciones de la Obra
{{desc_condiciones_obra}}`,
  template: () => ({
    name: '',
    description: '',
    value: '',
    content: '',
    isGlobal: false,
    isDefault: false
  })
})

const emit = defineEmits<{
  close: [any]
  afterLeave: []
}>()

// FieldConfig section labels for the sidebar checkboxes
const sectionLabels: Record<string, string> = {
  'obra.info_basica': 'Info Básica',
  'obra.ubicacion': 'Ubicación',
  'obra.caracteristicas': 'Características Técnicas',
  'obra.presupuesto': 'Presupuesto',
  'obra.tiempo_costes': 'Tiempo y Costes',
  'obra.capitulos': 'Capítulos',
  'plan.info_general': 'Info General',
  'plan.entorno': 'Entorno',
  'plan.interferencias': 'Interferencias',
  'plan.servicios': 'Servicios',
  'plan.asistencia': 'Asistencia',
  'plan.condiciones_ambientales': 'Condiciones Ambientales',
  'plan.detalles_graficos': 'Detalles Gráficos',
  'contratista': 'Contratista',
  'promotor': 'Promotor'
}

const sectionKeys = Object.keys(sectionLabels)

function toggleFieldConfig(key: string) {
  if (!localTemplate.value.fieldConfig) {
    localTemplate.value.fieldConfig = createFullFieldConfig()
  }
  const config = localTemplate.value.fieldConfig!
  const parts = key.split('.')
  if (parts.length === 2) {
    const [group, field] = parts as [keyof TemplateFieldConfig, string]
    ;(config[group] as Record<string, boolean>)[field] = !(config[group] as Record<string, boolean>)[field]
  } else {
    ;(config as Record<string, boolean>)[key] = !(config as Record<string, boolean>)[key]
  }
  localTemplate.value = { ...localTemplate.value, fieldConfig: { ...config } }
}

function isFieldEnabled(key: string): boolean {
  if (!localTemplate.value.fieldConfig) return true
  const config = localTemplate.value.fieldConfig
  const parts = key.split('.')
  if (parts.length === 2) {
    const [group, field] = parts as [keyof TemplateFieldConfig, string]
    return (config[group] as Record<string, boolean>)[field] ?? true
  }
  return (config as Record<string, boolean>)[key] ?? true
}

// Reactive state
const isSaving = ref(false)
const editorRef = ref<any>(null)
const templatesStore = useTemplatesStore()
const userStore = useUserStore()

const localTemplate = ref<TemplateForm>({
  name: props.template?.name || '',
  description: props.template?.description || '',
  value: props.template?.value || (props.template as any)?._id || (props.template as any)?.id || '',
  content: props.template?.content || props.defaultContent,
  isGlobal: props.template?.isGlobal !== undefined ? props.template.isGlobal : false,
  isDefault: props.template?.isDefault !== undefined ? props.template.isDefault : false,
  fieldConfig: (props.template as any)?.fieldConfig || undefined
})

// Watch for changes in props.template and update localTemplate accordingly
watch(() => props.template, (newTemplate) => {
  if (newTemplate && Object.keys(newTemplate).length > 0) {
    localTemplate.value = {
      name: newTemplate.name || '',
      description: newTemplate.description || '',
      value: newTemplate.value || (newTemplate as any)._id || (newTemplate as any).id || '',
      content: newTemplate.content || props.defaultContent,
      isGlobal: newTemplate.isGlobal !== undefined ? newTemplate.isGlobal : false,
      isDefault: newTemplate.isDefault !== undefined ? newTemplate.isDefault : false,
      fieldConfig: (newTemplate as any)?.fieldConfig || undefined
    }
  } else {
    localTemplate.value = {
      name: '',
      description: '',
      value: '',
      content: props.defaultContent,
      isGlobal: false,
      isDefault: false
    }
  }
}, { deep: true, immediate: true })

// Image gallery state
const uploadedImages = ref<Array<{ url: string, name: string, description: string, date: string }>>([])
const showImageGallery = ref(false)
const loadingImages = ref(false)

// Image parameters modal state
const showImageParamsModal = ref(false)
const currentImageParams = ref({
  url: '',
  name: '',
  position: 'center',
  width: '400',
  height: '300'
})

// Variables panel toggle
const showVariablesPanel = ref(props.showVariables)

function toggleVariables() {
  showVariablesPanel.value = !showVariablesPanel.value
}

function updateTemplate(key: keyof TemplateForm, value: any) {
  console.log(`📝 ModalTemplateCreate - updateTemplate: ${key} = ${value}`)
  localTemplate.value = { ...localTemplate.value, [key]: value }

  // Auto-generate slug from name when creating a new template
  if (key === 'name' && !props.template?.value) {
    const slug = value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 60)
    localTemplate.value = { ...localTemplate.value, value: slug }
  }

  console.log('📝 ModalTemplateCreate - Updated localTemplate:', localTemplate.value)
}

// No need for v-model with overlay pattern

const renderedContent = computed(() => {
  // Use the localTemplate content which should have the correct template data
  const content = localTemplate.value.content
  // For template editing, show the content with variables highlighted
  // instead of rendering with hardcoded values
  return content
})

// Methods
// Image gallery methods
const loadUploadedImages = async () => {
  loadingImages.value = true
  try {
    // Fetch images from your S3 storage or API endpoint
    const response = await $fetch('/api/images/user', {
      headers: {
        Authorization: `Bearer ${userStore.user?.accessToken}`
      }
    })
    uploadedImages.value = response.images || []
  } catch (error) {
    console.error('Error loading images:', error)
    uploadedImages.value = []
  } finally {
    loadingImages.value = false
  }
}

const copyImageUrl = async (imageUrl: string, imageName: string) => {
  try {
    await navigator.clipboard.writeText(imageUrl)
    // Show a toast or notification
    useToast().add({
      title: 'URL Copiada',
      description: `URL de ${imageName} copiada al portapapeles`,
      color: 'success',
      icon: 'i-heroicons-clipboard-document-check'
    })
  } catch (error) {
    console.error('Error copying URL:', error)
    useToast().add({
      title: 'Error',
      description: 'No se pudo copiar la URL',
      color: 'error'
    })
  }
}

const insertImageMarkdown = async (imageUrl: string, imageName: string) => {
  // Set the current image parameters and show the modal
  currentImageParams.value = {
    url: imageUrl,
    name: imageName,
    position: 'center',
    width: '400',
    height: '300'
  }
  showImageParamsModal.value = true
  await nextTick()
}

const insertImageWithParams = () => {
  const { url, name, position, width, height } = currentImageParams.value

  // Validate position
  const validPositions = ['left', 'center', 'right']
  const imagePosition = validPositions.includes(position) ? position : 'center'

  // Build the image helper with parameters
  let imageHelper = `{{image "${url}"`
  imageHelper += ` position="${imagePosition}"`

  // Only add width/height if they're provided and not empty
  if (width && width.trim() !== '') {
    const widthNum = parseInt(width)
    if (!isNaN(widthNum) && widthNum > 0) {
      imageHelper += ` width=${widthNum}`
    }
  }

  if (height && height.trim() !== '') {
    const heightNum = parseInt(height)
    if (!isNaN(heightNum) && heightNum > 0) {
      imageHelper += ` height=${heightNum}`
    }
  }

  imageHelper += ` alt="${name}"}}`

  if (!editorRef.value) {
    console.warn('No editor reference found')
    return
  }

  // Use md-editor-v3's built-in insert method
  editorRef.value.insert((selectedText: string) => {
    return {
      targetValue: imageHelper,
      select: false, // Don't select the inserted image helper
      deviationStart: 0,
      deviationEnd: 0
    }
  })

  // Close the modal
  showImageParamsModal.value = false
}

const cancelImageParams = () => {
  showImageParamsModal.value = false
  currentImageParams.value = {
    url: '',
    name: '',
    position: 'center',
    width: '400',
    height: '300'
  }
}

function insertVariable(variableKey: string) {
  console.log('🔧 ModalTemplateCreate - insertVariable called with:', variableKey)

  // Check if the variable key already contains curly braces
  const formattedVariable = variableKey.startsWith('{{') && variableKey.endsWith('}}')
    ? variableKey
    : `{{${variableKey}}}`

  if (!editorRef.value) {
    console.warn('No editor reference found')
    return
  }

  // Use md-editor-v3's built-in insert method
  editorRef.value.insert((selectedText: string) => {
    return {
      targetValue: formattedVariable,
      select: true, // Automatically select the inserted variable
      deviationStart: 0,
      deviationEnd: 0
    }
  })
}

function closeModal() {
  emit('close', null)
}

async function handleSave() {
  isSaving.value = true
  try {
    // Always use localTemplate.value as it contains the user's input
    const templateData = localTemplate.value
    
    // Emit close with the template data - overlay will resolve the promise
    emit('close', templateData)
  } finally {
    isSaving.value = false
  }
}

// Initialize form when component mounts
onMounted(() => {
  console.log('🔧 ModalTemplateCreate - onMounted called')
  console.log('🔧 ModalTemplateCreate - props.template:', props.template)
  console.log('🔧 ModalTemplateCreate - props.defaultContent length:', props.defaultContent?.length)

  // Load images when component mounts or variables panel is shown
  loadUploadedImages()

  // Also load when variables panel is toggled
  watch(showVariablesPanel, (newVal) => {
    if (newVal) {
      loadUploadedImages()
    }
  })
})

onUpdated(() => {
  console.log('🔧 ModalTemplateCreate - onUpdated called')
})
</script>
