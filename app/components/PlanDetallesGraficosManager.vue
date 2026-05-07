<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Detalles Gráficos
        </h3>
        <p
          v-if="detallesGraficos.length > 0"
          class="text-xs text-green-600 dark:text-green-400 mt-1"
        >
          <UIcon
            name="i-heroicons-check-circle"
            class="inline mr-1"
          />
          Using permanent public URLs - no expiration
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="detallesGraficos.length > 0"
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-eye"
          @click="showPreview = !showPreview"
        >
          {{ showPreview ? 'Hide' : 'Show' }} Preview
        </UButton>
        <UButton
          v-if="detallesGraficos.length > 0"
          color="error"
          variant="ghost"
          size="xs"
          icon="i-heroicons-trash"
          @click="clearAllDetalles"
        >
          Clear All
        </UButton>
      </div>
    </div>

    <!-- Description -->
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Select images for graphic details that will be included in your safety plan.
      You can choose from your personal images or admin-shared images.
    </p>

    <!-- Main Selector -->
    <DetallesGraficosSelector
      v-model="detallesGraficos"
      modal-title="Select Images for Detalles Gráficos"
      :allow-multiple="true"
      :show-upload-button="true"
      @images-selected="handleImagesSelected"
    />

    <!-- Preview Section -->
    <div
      v-if="showPreview && detallesGraficos.length > 0"
      class="mt-6"
    >
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h4 class="text-base font-semibold text-gray-900 dark:text-white">
              Preview
            </h4>
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-arrow-down-tray"
                @click="downloadMarkdown"
              >
                Download MD
              </UButton>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-clipboard"
                @click="copyMarkdown"
              >
                Copy MD
              </UButton>
            </div>
          </div>
        </template>

        <!-- Image Gallery Preview -->
        <div class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(image, index) in detallesGraficos"
              :key="index"
              class="relative group"
            >
              <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <img
                  :src="image.url"
                  :alt="image.name"
                  class="w-full h-full object-cover transition-transform group-hover:scale-105"
                  @error="handleImageError($event, image)"
                  @load="handleImageLoad"
                >
                <!-- Image Info Overlay -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-end">
                  <div class="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="text-sm font-medium truncate">
                      {{ image.name }}
                    </div>
                    <div class="text-xs opacity-75">
                      {{ image.isAdminShared ? 'Admin' : 'Your' }} image
                    </div>
                  </div>
                </div>
                <!-- Error State -->
                <div
                  v-if="image.hasError"
                  class="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20"
                >
                  <div class="text-center p-4">
                    <UIcon
                      name="i-heroicons-exclamation-triangle"
                      class="text-red-500 text-2xl mb-2"
                    />
                    <div class="text-xs text-red-600 dark:text-red-400">
                      Failed to load
                    </div>
                  </div>
                </div>
              </div>
              <!-- Image Actions -->
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="flex gap-1">
                  <UButton
                    size="2xs"
                    color="white"
                    variant="solid"
                    icon="i-heroicons-eye"
                    @click="previewImage(image)"
                  />
                  <UButton
                    size="2xs"
                    color="white"
                    variant="solid"
                    icon="i-heroicons-x-mark"
                    @click="removeImage(index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Markdown Preview -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Markdown Output:
          </h5>
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
            <pre class="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ generatedMarkdown }}</pre>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Image Preview Modal -->
    <UModal
      v-model="showImageModal"
      :ui="{ width: 'sm' }"
    >
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ selectedImage?.name }}
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showImageModal = false"
            />
          </div>
        </template>

        <div
          v-if="selectedImage"
          class="space-y-4"
        >
          <div class="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img
              :src="selectedImage.url"
              :alt="selectedImage.name"
              class="w-full h-full object-contain"
            >
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Type:</span>
              <span class="font-medium">{{ selectedImage.isAdminShared ? 'Admin Shared' : 'Your Image' }}</span>
            </div>
            <div
              v-if="selectedImage.description"
              class="text-sm"
            >
              <span class="text-gray-600 dark:text-gray-400">Description:</span>
              <p class="mt-1">
                {{ selectedImage.description }}
              </p>
            </div>
            <div class="text-sm">
              <span class="text-gray-600 dark:text-gray-400">URL:</span>
              <div class="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono break-all">
                {{ selectedImage.url }}
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </UModal>

    <!-- Template Integration Section -->
    <div
      v-if="detallesGraficos.length > 0"
      class="mt-6"
    >
      <UCard>
        <template #header>
          <h4 class="text-base font-semibold text-gray-900 dark:text-white">
            Template Integration
          </h4>
        </template>

        <div class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div class="flex items-start space-x-3">
              <UIcon
                name="i-heroicons-information-circle"
                class="text-blue-500 mt-0.5"
              />
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="font-medium mb-2">
                  How to use in templates:
                </p>
                <div class="space-y-1 text-xs">
                  <p>• These images will be automatically included in your plan templates</p>
                  <p>• Use the markdown below to include them in custom templates</p>
                  <p>• Images are stored as URLs and will work in PDF generation</p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Generated Markdown:
              </label>
              <textarea
                :value="generatedMarkdown"
                readonly
                class="w-full h-32 text-xs font-mono p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900"
                placeholder="Generated markdown will appear here..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Variables:
              </label>
              <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div><code class="text-primary">&lbrace;&lbrace;detalles_graficos&rbrace;&rbrace;</code> - All selected images</div>
                <div><code class="text-primary">&lbrace;&lbrace;detalles_graficos_count&rbrace;&rbrace;</code> - Number of images</div>
                <div><code class="text-primary">&lbrace;&lbrace;detalles_graficos_admin&rbrace;&rbrace;</code> - Admin images only</div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Stats -->
    <div
      v-if="detallesGraficos.length > 0"
      class="mt-4 grid grid-cols-3 gap-4"
    >
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-primary-600">
          {{ detallesGraficos.length }}
        </div>
        <div class="text-xs text-gray-500">
          Total Images
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-success-600">
          {{ adminImagesCount }}
        </div>
        <div class="text-xs text-gray-500">
          Admin Images
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-blue-600">
          {{ userImagesCount }}
        </div>
        <div class="text-xs text-gray-500">
          Your Images
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlanesStore } from '~/stores/planes'
import DetallesGraficosSelector from './DetallesGraficosSelector.vue'
import MarkdownIt from 'markdown-it'

interface ImageItem {
  url: string
  name: string
  description?: string
  date?: string
  isAdminShared?: boolean
  uploadedBy?: string
  hasError?: boolean
}

// Store
const planesStore = usePlanesStore()

// State
const showPreview = ref(false)
const showImageModal = ref(false)
const selectedImage = ref<ImageItem | null>(null)

// Helper function to transform old bucket URLs to new public URLs
const transformImageUrl = (url: string): string => {
  if (url.includes('preveniusimages.s3.eu-west-1.amazonaws.com')) {
    // Remove signed URL parameters and convert to public URL
    const urlWithoutParams = url.split('?')[0]
    const newUrl = urlWithoutParams.replace('preveniusimages', 'prevenius-public-images')
    console.log('🔄 Transformed URL:', url.substring(0, 50) + '...', '->', newUrl)
    return newUrl
  }
  // Also handle the case where https is already being replaced with http
  if (url.includes('https://prevenius-public-images.s3.eu-west-1.amazonaws.com')) {
    // Ensure we keep https:// protocol
    const urlWithoutParams = url.split('?')[0]
    console.log('✅ URL already has correct format:', urlWithoutParams.substring(0, 50) + '...')
    return urlWithoutParams
  }
  return url
}

// Computed
const detallesGraficos = computed({
  get: () => {
    const rawImages = (planesStore.planActual?.det_graf as ImageItem[]) || []
    // Transform URLs to point to new public bucket
    return rawImages.map(img => ({
      ...img,
      url: transformImageUrl(img.url)
    }))
  },
  set: (value: ImageItem[]) => {
    planesStore.updatePlanField('det_graf', value)
  }
})

const adminImagesCount = computed(() =>
  detallesGraficos.value.filter(img => img.isAdminShared).length
)

const userImagesCount = computed(() =>
  detallesGraficos.value.filter(img => !img.isAdminShared).length
)

const markdownPreview = computed(() => {
  const md = new MarkdownIt()
  const markdown = detallesGraficos.value
    .map(img => `![${img.name}](${img.url})`)
    .join('\n\n')
  return md.render(markdown || 'No images selected')
})

const generatedMarkdown = computed(() => {
  return detallesGraficos.value
    .map(img => `![${img.name}](${img.url})`)
    .join('\n\n')
})

// Methods
const handleImagesSelected = (images: ImageItem[]) => {
  console.log('📸 PlanDetallesGraficosManager - Images selected:', images.length)
  // The v-model already handles updating the store through computed setter
}

const handleImageError = (event: Event, image: ImageItem) => {
  console.error('❌ Failed to load image:', image.name, image.url)
  // Mark image as having error for UI feedback
  image.hasError = true

  // Check if this might be an image that doesn't exist in the new bucket
  if (image.url.includes('prevenius-public-images')) {
    useToast().add({
      title: 'Image Not Found',
      description: `The image ${image.name} may not be copied to the new bucket yet.`,
      color: 'warning',
      timeout: 5000
    })
  } else {
    useToast().add({
      title: 'Image Load Error',
      description: `Failed to load ${image.name}. Please check the image URL.`,
      color: 'error',
      timeout: 5000
    })
  }
}

const handleImageLoad = () => {
  // Image loaded successfully
}

const previewImage = (image: ImageItem) => {
  selectedImage.value = image
  showImageModal.value = true
}

const removeImage = (index: number) => {
  const currentImages = [...detallesGraficos.value]
  const removedImage = currentImages[index]

  if (confirm(`Are you sure you want to remove "${removedImage.name}"?`)) {
    currentImages.splice(index, 1)
    detallesGraficos.value = currentImages

    useToast().add({
      title: 'Image Removed',
      description: `"${removedImage.name}" has been removed from the selection.`,
      color: 'info'
    })
  }
}

const clearAllDetalles = () => {
  if (confirm('Are you sure you want to remove all selected images?')) {
    detallesGraficos.value = []
    useToast().add({
      title: 'Cleared',
      description: 'All detalles gráficos removed',
      color: 'info'
    })
  }
}

const downloadMarkdown = () => {
  const markdown = generatedMarkdown.value
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `detalles-graficos-${Date.now()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  useToast().add({
    title: 'Downloaded',
    description: 'Markdown file downloaded successfully',
    color: 'success'
  })
}

const copyMarkdown = async () => {
  try {
    await navigator.clipboard.writeText(generatedMarkdown.value)
    useToast().add({
      title: 'Copied!',
      description: 'Markdown copied to clipboard',
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to copy markdown:', error)
    useToast().add({
      title: 'Copy failed',
      description: 'Could not copy markdown to clipboard',
      color: 'error'
    })
  }
}

// Template variable helpers (for use in templates)
const getTemplateVariables = () => {
  return {
    detalles_graficos: generatedMarkdown.value,
    detalles_graficos_count: detallesGraficos.value.length,
    detalles_graficos_admin: detallesGraficos.value
      .filter(img => img.isAdminShared)
      .map(img => `![${img.name}](${img.url})`)
      .join('\n\n'),
    detalles_graficos_user: detallesGraficos.value
      .filter(img => !img.isAdminShared)
      .map(img => `![${img.name}](${img.url})`)
      .join('\n\n')
  }
}

// Expose template variables for parent components
const templateVariables = computed(() => getTemplateVariables())

// Make template variables available to parent
const exposeTemplateVars = () => {
  return templateVariables.value
}

defineExpose({
  getTemplateVariables: exposeTemplateVars,
  detallesGraficos,
  markdownPreview
})
</script>
