<template>
  <div>
    <!-- Button to open selector -->
    <div class="flex items-center gap-2 mb-4">
      <UButton
        color="primary"
        variant="soft"
        icon="i-heroicons-photo"
        size="sm"
        @click="openSelector"
      >
        Select Detalles Gráficos
      </UButton>

      <UButton
        v-if="showUploadButton"
        color="neutral"
        variant="ghost"
        icon="i-heroicons-arrow-up-tray"
        size="sm"
        @click="openUploadModal"
      >
        Upload New
      </UButton>

      <UButton
        v-if="selectedImages.length > 0"
        color="error"
        variant="ghost"
        icon="i-heroicons-trash"
        size="sm"
        @click="clearSelection"
      >
        Clear All
      </UButton>

      <UBadge
        v-if="selectedImages.length > 0"
        color="primary"
        variant="soft"
      >
        {{ selectedImages.length }} selected
      </UBadge>
    </div>

    <!-- Selected Images Preview -->
    <div
      v-if="selectedImages.length > 0"
      class="mb-4"
    >
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Selected Images:
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div
          v-for="(image, index) in selectedImages"
          :key="index"
          class="relative group"
        >
          <img
            :src="image.url"
            :alt="image.name"
            class="w-full h-64 object-contain rounded border bg-gray-100 dark:bg-gray-800"
            crossorigin="anonymous"
          >
          <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <UButton
              icon="i-heroicons-x-mark"
              color="error"
              variant="solid"
              size="xs"
              square
              @click="removeImage(index)"
            />
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 truncate">
            {{ image.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Image Selector Modal -->
    <UModal
      v-model:open="showSelector"
      fullscreen
      :title="modalTitle"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-3">
            <UIcon
              name="i-heroicons-photo"
              class="w-5 h-5 text-gray-500"
            />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ modalTitle }}
            </h3>
          </div>
          <div class="flex items-center space-x-2">
            <UButton
              v-if="selectedImagesForModal.length > 0"
              color="primary"
              variant="solid"
              size="sm"
              @click="confirmSelection"
            >
              Select {{ selectedImagesForModal.length }} Images
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-x-mark-20-solid"
              @click="closeSelector"
            />
          </div>
        </div>
      </template>

      <template #body>
        <div class="h-full flex">
          <!-- Sidebar with Image Gallery -->
          <div class="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 space-y-4">
            <!-- Image Source Tabs -->
            <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div class="flex space-x-1">
                <UButton
                  v-for="tab in imageTabs"
                  :key="tab.key"
                  :color="activeTab === tab.key ? 'primary' : 'neutral'"
                  :variant="activeTab === tab.key ? 'solid' : 'ghost'"
                  size="xs"
                  @click="activeTab = tab.key"
                >
                  {{ tab.label }}
                </UButton>
              </div>
            </div>

            <!-- Gallery Controls -->
            <div class="flex items-center justify-between">
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ activeTab === 'admin' ? 'Admin Shared' : 'Your Images' }}
              </h5>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-arrow-path"
                :loading="loadingImages"
                @click="loadImages"
              />
            </div>

            <!-- Loading State -->
            <div
              v-if="loadingImages"
              class="flex justify-center py-4"
            >
              <UIcon
                name="i-heroicons-arrow-path"
                class="w-4 h-4 animate-spin"
              />
            </div>

            <!-- Empty State -->
            <div
              v-else-if="availableImages.length === 0"
              class="text-center py-8 px-4"
            >
              <div class="flex flex-col items-center justify-center space-y-3">
                <UIcon
                  name="i-heroicons-photo"
                  class="w-12 h-12 text-gray-400"
                />
                <div class="text-center">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    No images found
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {{ activeTab === 'admin' ? 'No admin shared images available' : 'Upload some images to get started'
                    }}
                  </p>
                  <UButton
                    v-if="activeTab === 'user'"
                    color="primary"
                    variant="solid"
                    size="xs"
                    icon="i-heroicons-arrow-up-tray"
                    @click="openUploadModal"
                  >
                    Upload Images
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Image Grid -->
            <div
              v-else
              class="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto"
            >
              <div
                v-for="(image, index) in availableImages"
                :key="index"
                class="group relative cursor-pointer border rounded hover:shadow-md transition-all"
                :class="{ 'ring-2 ring-primary-500': isImageSelected(image) }"
                @click="toggleImageSelection(image)"
              >
                <img
                  v-if="isValidImageUrl(image.url)"
                  :src="image.url"
                  :alt="image.name"
                  class="w-full h-32 object-contain rounded bg-gray-100 dark:bg-gray-800"
                  loading="lazy"
                  crossorigin="anonymous"
                  :data-loaded="isImageLoaded(image.url)"
                  :data-failed="isImageFailed(image.url)"
                  :data-url="image.url"
                  :data-location="'left-grid'"
                  @error="handleImageError($event, image)"
                  @load="handleImageLoad(image.url)"
                >
                <div
                  v-else
                  class="w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded"
                >
                  <div class="text-center">
                    <UIcon
                      name="i-heroicons-exclamation-triangle"
                      class="w-4 h-4 text-red-500 mx-auto mb-1"
                    />
                    <p class="text-xs text-red-600 dark:text-red-400">
                      Invalid URL
                    </p>
                  </div>
                </div>
                <div
                  v-if="!isImageLoaded(image.url) && !isImageFailed(image.url)"
                  class="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded"
                >
                  <div class="text-center">
                    <UIcon
                      name="i-heroicons-arrow-path"
                      class="w-6 h-6 text-gray-400 mx-auto mb-1 animate-spin"
                    />
                    <p class="text-xs text-gray-500">
                      Loading...
                    </p>
                  </div>
                </div>
                <div
                  v-if="isImageFailed(image.url)"
                  class="absolute inset-0 bg-red-50 dark:bg-red-900/20 flex items-center justify-center rounded"
                >
                  <div class="text-center p-2">
                    <UIcon
                      name="i-heroicons-exclamation-triangle"
                      class="w-6 h-6 text-red-500 mx-auto mb-1"
                    />
                    <p class="text-xs text-red-600 dark:text-red-400">
                      Failed to load
                    </p>
                  </div>
                </div>
                <div
                  class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center"
                >
                  <div class="text-white text-xs text-center p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="mb-1">
                      {{ isImageSelected(image) ? '✓ Selected' : 'Click to select' }}
                    </div>
                    <button
                      class="block w-full mb-1 hover:bg-gray-700 rounded px-1 py-0.5"
                      @click.stop="copyImageUrl(image.url, image.name)"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
                <div
                  class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 py-0.5 truncate rounded-b"
                >
                  {{ image.name }}
                </div>
                <div
                  v-if="isImageSelected(image)"
                  class="absolute top-1 right-1 bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ✓
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Area -->
          <div class="flex-1 p-4">
            <div
              class="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Selected Images Preview:
              </h4>
              <div
                v-if="selectedImagesForModal.length === 0"
                class="text-center text-gray-500 py-8"
              >
                <UIcon
                  name="i-heroicons-photo"
                  class="w-8 h-8 mx-auto mb-2"
                />
                <p class="text-sm">
                  No images selected for preview
                </p>
              </div>
              <div
                v-else
                class="grid grid-cols-2 gap-6"
              >
                <div
                  v-for="(image, index) in selectedImagesForModal"
                  :key="index"
                  class="relative group border rounded-lg overflow-hidden"
                >
                  <img
                    v-if="isValidImageUrl(image.url)"
                    :src="image.url"
                    :alt="image.name"
                    class="w-full h-80 object-contain rounded bg-gray-100 dark:bg-gray-800"
                    loading="lazy"
                    crossorigin="anonymous"
                    :data-loaded="isImageLoaded(image.url)"
                    :data-failed="isImageFailed(image.url)"
                    :data-url="image.url"
                    :data-location="'right-preview'"
                    @error="handleImageError($event, image)"
                    @load="handleImageLoad(image.url)"
                  >
                  <div
                    v-else
                    class="w-full h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded"
                  >
                    <div class="text-center">
                      <UIcon
                        name="i-heroicons-exclamation-triangle"
                        class="w-8 h-8 text-red-500 mx-auto mb-2"
                      />
                      <p class="text-xs text-red-600 dark:text-red-400">
                        Invalid image URL
                      </p>
                      <p class="text-xs text-gray-500 mt-1 truncate">
                        {{ image.url }}
                      </p>
                    </div>
                  </div>
                  <div
                    class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 truncate"
                  >
                    {{ image.name }}
                  </div>
                  <div
                    v-if="!isImageLoaded(image.url) && !isImageFailed(image.url)"
                    class="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                  >
                    <div class="text-center">
                      <UIcon
                        name="i-heroicons-arrow-path"
                        class="w-6 h-6 text-gray-400 mx-auto mb-1 animate-spin"
                      />
                      <p class="text-xs text-gray-500">
                        Loading...
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="isImageFailed(image.url)"
                    class="absolute inset-0 bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
                  >
                    <div class="text-center p-2">
                      <UIcon
                        name="i-heroicons-exclamation-triangle"
                        class="w-6 h-6 text-red-500 mx-auto mb-1"
                      />
                      <p class="text-xs text-red-600 dark:text-red-400">
                        Failed to load
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Upload Modal -->
    <UModal v-model:open="showUploadModal">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-3">
            <UIcon
              name="i-heroicons-arrow-up-tray"
              class="w-5 h-5 text-gray-500"
            />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Upload New Images
            </h3>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-heroicons-x-mark-20-solid"
            @click="closeUploadModal"
          />
        </div>
      </template>

      <template #body>
        <div class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div class="flex items-start space-x-3">
              <UIcon
                name="i-heroicons-information-circle"
                class="text-blue-500 mt-0.5"
              />
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="font-medium mb-1">
                  Upload Instructions:
                </p>
                <ul class="list-disc list-inside space-y-1 text-xs">
                  <li>Select images to upload to your personal gallery</li>
                  <li>Uploaded images will appear in "My Images" tab</li>
                  <li>You can then select them for your detalles gráficos</li>
                </ul>
              </div>
            </div>
          </div>
          <DetallesGraficosComponent @images-uploaded="handleImagesUploaded" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { useToast } from '#imports'
import DetallesGraficosComponent from './DetallesGraficosComponent.vue'
import MarkdownIt from 'markdown-it'

interface ImageItem {
  url: string
  name: string
  description?: string
  date?: string
  isAdminShared?: boolean
  uploadedBy?: string
}

interface Props {
  modelValue: ImageItem[]
  modalTitle?: string
  showUploadButton?: boolean
  allowMultiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  modalTitle: 'Select Detalles Gráficos',
  showUploadButton: true,
  allowMultiple: true
})

const emit = defineEmits<{
  'update:modelValue': [images: ImageItem[]]
  'images-selected': [images: ImageItem[]]
}>()

// Store
const userStore = useUserStore()

// State
const showSelector = ref(false)
const showUploadModal = ref(false)
const loadingImages = ref(false)
const activeTab = ref<string>('user')
const userImages = ref<ImageItem[]>([])
const adminImages = ref<ImageItem[]>([])
const selectedImagesForModal = ref<ImageItem[]>([])
const loadedImages = ref<Set<string>>(new Set())
const failedImages = ref<Set<string>>(new Set())

// Image tabs
const imageTabs = [
  { key: 'user', label: 'My Images' },
  { key: 'admin', label: 'Admin Shared' }
]

// Computed
const selectedImages = computed(() => props.modelValue)

const availableImages = computed(() => {
  return activeTab.value === 'admin' ? adminImages.value : userImages.value
})

const markdownPreview = computed(() => {
  // Return empty string since we're showing actual images now
  return ''
})

// Methods
const openSelector = async () => {
  showSelector.value = true
  await loadImages()
}

const closeSelector = () => {
  showSelector.value = false
  selectedImagesForModal.value = []
}

const openUploadModal = () => {
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
}

const loadImages = async () => {
  if (!userStore.user?.accessToken) return

  loadingImages.value = true
  try {
    // Load user images
    const userResponse = await $fetch('/api/images/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userStore.user.accessToken}`
      }
    }).catch((error) => {
      console.error('❌ Error loading user images:', error)
      return { images: [] }
    })

    // Load admin images
    const adminResponse = await $fetch('/api/images/admin', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userStore.user.accessToken}`
      }
    }).catch((error) => {
      console.error('❌ Error loading admin images:', error)
      return { images: [] }
    })

    console.log('📸 Loaded images:', {
      userImages: userResponse.images?.length || 0,
      adminImages: adminResponse.images?.length || 0,
      sampleUserImage: userResponse.images?.[0]?.url,
      sampleAdminImage: adminResponse.images?.[0]?.url,
      firstUserImageDetails: userResponse.images?.[0]
        ? {
            url: userResponse.images[0].url,
            name: userResponse.images[0].name,
            hasValidUrl: isValidImageUrl(userResponse.images[0].url)
          }
        : null
    })

    userImages.value = (userResponse.images || []).map((img: any) => ({
      url: img.url,
      name: img.name,
      description: img.description,
      date: img.uploadDate || img.date,
      isAdminShared: false
    }))

    adminImages.value = (adminResponse.images || []).map((img: any) => ({
      url: img.url,
      name: img.name,
      description: img.description || 'Shared admin image',
      date: img.date,
      isAdminShared: true,
      uploadedBy: img.uploadedBy
    }))
  } catch (error) {
    console.error('Error loading images:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to load images',
      color: 'error'
    })
  } finally {
    loadingImages.value = false
  }
}

const toggleImageSelection = (image: ImageItem) => {
  const index = selectedImagesForModal.value.findIndex(img => img.url === image.url)

  if (index >= 0) {
    selectedImagesForModal.value.splice(index, 1)
  } else {
    if (!props.allowMultiple) {
      selectedImagesForModal.value = [image]
    } else {
      selectedImagesForModal.value.push(image)
    }
  }
}

const isImageSelected = (image: ImageItem) => {
  return selectedImagesForModal.value.some(img => img.url === image.url)
}

const copyImageUrl = async (url: string, name: string) => {
  try {
    await navigator.clipboard.writeText(url)
    // Use a simple notification instead of useToast
    console.log('✅ URL copied to clipboard:', name)
    // You could also use a simple DOM notification here
  } catch (error) {
    console.error('❌ Failed to copy URL:', error)
  }
}

const confirmSelection = () => {
  emit('update:modelValue', [...selectedImagesForModal.value])
  emit('images-selected', [...selectedImagesForModal.value])
  closeSelector()

  console.log(`✅ ${selectedImagesForModal.value.length} images selected for detalles gráficos`)
}

const removeImage = (index: number) => {
  const newImages = [...selectedImages.value]
  newImages.splice(index, 1)
  emit('update:modelValue', newImages)
}

const clearSelection = () => {
  emit('update:modelValue', [])
  console.log('🗑️ All selected images removed')
}

const handleImagesUploaded = () => {
  closeUploadModal()
  // Clear the modal selection to avoid confusion with new uploads
  selectedImagesForModal.value = []

  // Switch to user tab to show newly uploaded images
  activeTab.value = 'user'

  // Refresh images to show the new uploads
  loadImages()

  console.log('📤 New images uploaded successfully')

  // Show a simple notification (you could enhance this with a proper toast)
  console.log('✅ Images uploaded! Switch to "My Images" tab to see them.')
}

// Image loading helpers
const isImageLoaded = (url: string) => {
  return loadedImages.value.has(url)
}

const isImageFailed = (url: string) => {
  return failedImages.value.has(url)
}

// Enhanced image loading with retry logic
const loadImageWithRetry = (url: string, maxRetries = 2) => {
  return new Promise((resolve, reject) => {
    let retries = 0

    const tryLoad = () => {
      const img = new Image()

      img.onload = () => {
        console.log('✅ Image loaded with retry:', url)
        loadedImages.value.add(url)
        resolve(true)
      }

      img.onerror = (err) => {
        console.warn(`❌ Image failed (attempt ${retries + 1}/${maxRetries + 1}):`, url, err)
        retries++

        if (retries <= maxRetries) {
          // Retry with a delay
          setTimeout(tryLoad, 500 * retries)
        } else {
          failedImages.value.add(url)
          reject(new Error(`Failed to load image after ${maxRetries + 1} attempts: ${url}`))
        }
      }

      // Enable CORS for cross-origin images (S3)
      img.crossOrigin = 'anonymous'
      img.src = url + (retries > 0 ? `?retry=${retries}` : '')
    }

    tryLoad()
  })
}

const isValidImageUrl = (url: string) => {
  if (!url || typeof url !== 'string') return false

  // Check if it's a valid URL
  try {
    const urlObj = new URL(url)

    // Check if it looks like an image URL or S3 URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const urlLower = url.toLowerCase()
    const hasImageExtension = imageExtensions.some(ext => urlLower.includes(ext))
    const isS3Url = url.includes('amazonaws.com') || url.includes('s3') || url.includes('preveniusimages')
    const isHttps = urlObj.protocol === 'https:'

    console.log('🔍 URL validation:', {
      url,
      hasImageExtension,
      isS3Url,
      isHttps,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname
    })

    return hasImageExtension || isS3Url
  } catch (error) {
    console.warn('❌ Invalid URL format:', url, error)
    return false
  }
}

const handleImageError = (event: Event, image: ImageItem) => {
  // Get location from data attribute
  const img = event.target as HTMLImageElement
  const location = img?.dataset.location || 'unknown'

  console.warn('❌ Image failed to load:', {
    url: image.url,
    name: image.name,
    isAdminShared: image.isAdminShared,
    timestamp: new Date().toISOString(),
    errorEvent: event,
    userAgent: navigator.userAgent,
    location: location
  })
  failedImages.value.add(image.url)

  // Try to get more details about the error
  if (img) {
    console.warn('Image error details:', {
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      currentSrc: img.currentSrc,
      crossOrigin: img.crossOrigin,
      referrerPolicy: img.referrerPolicy,
      dataset: img.dataset
    })
  }
}

const handleImageLoad = (url: string) => {
  console.log('✅ Image loaded successfully:', url)
  loadedImages.value.add(url)
}

// Initialize
onMounted(() => {
  // Pre-load images when component mounts
  if (showSelector.value) {
    preloadVisibleImages()
  }
})

// Watch for selector opening
watch(showSelector, (isOpen) => {
  if (isOpen) {
    preloadVisibleImages()
  }
})

// Preload images that are currently visible
const preloadVisibleImages = async () => {
  await nextTick()

  const visibleImages = availableImages.value.slice(0, 8) // Load first 8 images
  console.log('🔍 Preloading images:', visibleImages.length, 'images from', availableImages.value.length, 'total')

  for (const image of visibleImages) {
    if (isValidImageUrl(image.url) && !isImageLoaded(image.url) && !isImageFailed(image.url)) {
      console.log('📤 Preloading image:', image.url, image.name)
      try {
        await loadImageWithRetry(image.url, 1) // Try once for preloading
        console.log('✅ Preloaded successfully:', image.name)
      } catch (error) {
        console.warn('❌ Failed to preload image:', image.url, error)
      }
    } else {
      console.log('⏭️ Skipping preload for:', image.name, {
        valid: isValidImageUrl(image.url),
        loaded: isImageLoaded(image.url),
        failed: isImageFailed(image.url)
      })
    }
  }
}
</script>
