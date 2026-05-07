<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'

const props = defineProps<{
  planId: string
}>()

const files = ref<FileList | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

interface Photo {
  _id: string
  url: string
  name: string
  uploadedAt: Date
  uploadedBy: string
}

const photos = ref<Photo[]>([])
const storeUser = useUserStore()

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    files.value = target.files
  }
}

const handleFileUpload = async () => {
  if (!files.value || files.value.length === 0) return

  uploading.value = true
  error.value = null

  try {
    const fileArray = Array.from(files.value) as File[]

    for (const file of fileArray) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('planId', props.planId)

      const res = await $fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${storeUser.user?.accessToken}`
        }
      })

      if (res.success && res.data) {
        photos.value.push({
          _id: res.data._id,
          url: res.data.url,
          name: file.name,
          uploadedAt: new Date(),
          uploadedBy: storeUser.user?._id || ''
        })
      }
    }

    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    files.value = null
  } catch (err) {
    error.value = 'Failed to upload photos'
    console.error('Error uploading photos:', err)
  } finally {
    uploading.value = false
  }
}

const removePhoto = async (photoId: string) => {
  try {
    await $fetch(`/api/photos/${photoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${storeUser.user?.accessToken}`
      }
    })

    photos.value = photos.value.filter(photo => photo._id !== photoId)
  } catch (err) {
    error.value = 'Failed to delete photo'
    console.error('Error deleting photo:', err)
  }
}

const loadPhotos = async () => {
  if (!storeUser.user?.accessToken) {
    error.value = 'User not authenticated'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await $fetch(`/api/photos?planId=${props.planId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storeUser.user.accessToken}`
      }
    })

    if (response.data && Array.isArray(response.data)) {
      photos.value = response.data.map((photo: any) => ({
        _id: photo._id,
        url: photo.url,
        name: photo.name || 'Unnamed photo',
        uploadedAt: new Date(photo.uploadedAt),
        uploadedBy: photo.uploadedBy || ''
      }))
    }
  } catch (err) {
    error.value = 'Failed to load photos'
    console.error('Error loading photos:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPhotos()
})
</script>

<template>
  <div>
    <!-- Upload controls -->
    <div class="flex items-center gap-2 mb-4">
      <UInput
        id="file-input"
        ref="fileInput"
        type="file"
        multiple
        size="sm"
        icon="i-heroicons-folder"
        accept="image/*"
        @input="handleFileInput"
      />
      <UButton
        icon="i-heroicons-arrow-up-tray"
        color="primary"
        size="sm"
        :loading="uploading"
        :disabled="!files || files.length === 0"
        @click="handleFileUpload"
      >
        Upload
      </UButton>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex justify-center items-center py-8"
    >
      <UProgress />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600"
    >
      {{ error }}
      <UButton
        size="xs"
        color="error"
        variant="ghost"
        class="ml-2"
        @click="loadPhotos"
      >
        Retry
      </UButton>
    </div>

    <!-- Photos grid -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <div
        v-if="photos.length === 0"
        class="col-span-full text-center py-6 text-gray-500"
      >
        <UIcon
          name="i-heroicons-photo"
          class="w-10 h-10 mx-auto mb-2"
        />
        <p>No photos uploaded yet</p>
      </div>

      <div
        v-for="photo in photos"
        :key="photo._id"
        class="relative group"
      >
        <img
          :src="photo.url"
          :alt="photo.name"
          class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
        >
        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <UButton
            icon="i-heroicons-trash"
            color="error"
            variant="solid"
            size="xs"
            @click="removePhoto(photo._id)"
          >
            Delete
          </UButton>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
          {{ photo.name }}
        </p>
      </div>
    </div>
  </div>
</template>
