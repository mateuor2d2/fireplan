<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useToast } from '#imports'

// Emit events
const emit = defineEmits<{
  'images-uploaded': []
}>()

const files = ref<FileList | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const uploadPreview = ref<Post[]>([])
const showUploadPreview = ref(false)

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    files.value = target.files
  }
}

interface Post {
  title: string
  description: string
  image: {
    src: string
  }
  date: string
  s3Url?: string
  folder?: string
  key?: string
  isAdminShared?: boolean
  uploadedBy?: string
}
const storeUser = useUserStore()

const posts = ref<Post[]>([])
const handleFileUpload = () => {
  if (files.value) {
    const fileArray = Array.from(files.value) as File[]

    // Clear any previous upload preview
    uploadPreview.value = []
    showUploadPreview.value = true

    fileArray.forEach((file) => {
      // Create a FileReader to read the file content
      const reader = new FileReader()

      reader.onload = async (e) => {
        const content = e.target?.result as string

        // Add to upload preview (separate from main posts)
        const previewPost: Post = {
          title: file.name,
          description: 'Uploading...',
          image: { src: content },
          date: new Date().toISOString()
        }
        uploadPreview.value.push(previewPost)

        // Upload to S3
        try {
          const formData = new FormData()
          formData.append('file', file)

          const res = await $fetch('/api/s3/upload', {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: `Bearer ${storeUser.user.accessToken}`
            }
          })
          console.log('📤 File uploaded:', res)

          // Update the upload preview with S3 URL
          const uploadedPost = uploadPreview.value.find(p => p.title === file.name)
          if (uploadedPost) {
            if (res.data?.url) {
              uploadedPost.s3Url = res.data.url
              uploadedPost.folder = `users/${storeUser.user?._id}`
              uploadedPost.key = res.data.key
              uploadedPost.description = 'Upload complete'
              console.log('🔗 S3 URL saved:', res.data.url)
              console.log('📁 Upload folder:', uploadedPost.folder)

              // Emit event when upload is complete
              emit('images-uploaded')
            } else if ('url' in res && res.url) {
              uploadedPost.s3Url = res.url as string
              uploadedPost.description = 'Upload complete'
              console.log('🔗 S3 URL saved (legacy):', res.url)

              // Emit event when upload is complete
              emit('images-uploaded')
            }
          }
        } catch (error: any) {
          console.error('❌ Error uploading file:', error)
          const failedPost = uploadPreview.value.find(p => p.title === file.name)
          if (failedPost) {
            failedPost.description = 'Upload failed'
          }
        }
      }

      reader.onerror = () => {
        console.error('Error reading file:', file.name)
        const failedPost = uploadPreview.value.find(p => p.title === file.name)
        if (failedPost) {
          failedPost.description = 'Failed to read file'
        }
      }

      // Read the file as a data URL (base64)
      reader.readAsDataURL(file)
    })
  }
}

const removePost = (index: number) => {
  posts.value.splice(index, 1)
}

// Copy URL to clipboard
const copyToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    const toast = useToast()
    toast.add({
      title: 'Copied!',
      description: 'Image URL copied to clipboard',
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to copy URL:', error)
    const toast = useToast()
    toast.add({
      title: 'Copy failed',
      description: 'Could not copy URL to clipboard',
      color: 'error'
    })
  }
}

// Admin upload function for shared images
const handleAdminUpload = async () => {
  if (!files.value || files.value.length === 0) {
    error.value = 'Please select files first'
    return
  }

  if (storeUser.user?.role !== 'admin') {
    error.value = 'Only administrators can upload shared images'
    return
  }

  loading.value = true
  error.value = null

  try {
    const fileArray = Array.from(files.value) as File[]

    for (const file of fileArray) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', 'Admin shared image')

      const res = await $fetch('/api/images/admin-upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${storeUser.user.accessToken}`
        }
      })

      if (res.success && res.data) {
        // Add to posts immediately
        posts.value.push({
          title: file.name,
          description: 'Shared admin image',
          image: { src: res.data.url },
          date: new Date().toISOString(),
          s3Url: res.data.url,
          folder: res.data.folder,
          key: res.data.key,
          isAdminShared: true,
          uploadedBy: storeUser.user?._id
        })
        console.log('✅ Admin shared image uploaded:', res.data.url)
      }
    }

    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    files.value = null

    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Shared images uploaded successfully',
      color: 'success'
    })
  } catch (error: any) {
    console.error('❌ Error uploading admin images:', error)
    error.value = error.message || 'Failed to upload shared images'

    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to upload shared images',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Fetch user's existing images from S3
const loadUserImages = async () => {
  if (!storeUser.user?.accessToken) {
    error.value = 'User not authenticated'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Fetch user images
    const userResponse = await $fetch('/api/images/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storeUser.user.accessToken}`
      }
    })

    // Fetch admin shared images
    const adminResponse = await $fetch('/api/images/admin', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storeUser.user.accessToken}`
      }
    })

    // Clear existing posts and load from S3
    posts.value = []

    // Add user images
    if (userResponse.images && Array.isArray(userResponse.images)) {
      userResponse.images.forEach((image: any) => {
        posts.value.push({
          title: image.name,
          description: `Uploaded on ${new Date(image.uploadDate).toLocaleDateString()}`,
          image: { src: image.url },
          date: image.uploadDate,
          s3Url: image.url,
          folder: image.folder,
          key: image.key,
          isAdminShared: false
        })
      })
    }

    // Add admin shared images
    if (adminResponse.images && Array.isArray(adminResponse.images)) {
      adminResponse.images.forEach((image: any) => {
        posts.value.push({
          title: image.name,
          description: image.description || 'Shared admin image',
          image: { src: image.url },
          date: image.date,
          s3Url: image.url,
          folder: image.folder,
          key: image.key,
          isAdminShared: true,
          uploadedBy: image.uploadedBy
        })
      })
    }

    console.log(`Loaded ${posts.value.length} total images for user ${storeUser.user?._id} (${userResponse.images?.length || 0} user, ${adminResponse.images?.length || 0} admin)`)
  } catch (err: any) {
    console.error('Error loading images:', err)
    error.value = err.message || 'Failed to load images. Please try again.'
  } finally {
    loading.value = false
  }
}

// Refresh images
const refreshImages = async () => {
  await loadUserImages()
}

// Load images on component mount
onMounted(async () => {
  await loadUserImages()
})
</script>

<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <UInput
        id="file-input"
        ref="fileInput"
        type="file"
        multiple
        size="sm"
        icon="i-heroicons-folder"
        name="files[]"
        accept="image/*"
        @input="handleFileInput"
      />
      <UButton
        icon="i-heroicons-fire-solid"
        color="error"
        variant="ghost"
        size="xs"
        @click="handleFileUpload()"
      >
        Upload
      </UButton>
      <UButton
        icon="i-heroicons-arrow-path"
        color="primary"
        variant="ghost"
        size="xs"
        :loading="loading"
        @click="refreshImages"
      >
        Refresh
      </UButton>

      <!-- Admin upload button for shared images -->
      <UButton
        v-if="storeUser.user?.role === 'admin'"
        icon="i-heroicons-users"
        color="success"
        variant="ghost"
        size="xs"
        @click="handleAdminUpload()"
      >
        Upload Shared
      </UButton>
    </div>

    <!-- Upload Preview -->
    <div
      v-if="showUploadPreview && uploadPreview.length > 0"
      class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
    >
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-blue-700 dark:text-blue-300">
          Uploading Images
        </h4>
        <UButton
          color="primary"
          variant="ghost"
          size="xs"
          icon="i-heroicons-x-mark"
          @click="showUploadPreview = false"
        >
          Hide
        </UButton>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="(post, index) in uploadPreview"
          :key="index"
          class="relative group border rounded-lg overflow-hidden"
        >
          <img
            v-if="post.image?.src"
            :src="post.image.src"
            :alt="post.title"
            class="w-full h-20 object-cover"
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
            loading="lazy"
          >
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 truncate">
            {{ post.title }}
          </div>
          <div class="absolute top-1 right-1">
            <UBadge
              :color="post.description === 'Upload complete' ? 'success' : post.description === 'Upload failed' ? 'error' : 'warning'"
              variant="solid"
              size="xs"
            >
              {{ post.description || 'Uploading...' }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex justify-center items-center py-8"
    >
      <UProgress />
      <span class="ml-2">Loading images...</span>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded"
    >
      <p class="text-red-600">
        {{ error }}
      </p>
      <UButton
        size="xs"
        color="error"
        variant="ghost"
        @click="loadUserImages"
      >
        Try Again
      </UButton>
    </div>

    <!-- Images grid -->
    <div
      v-if="!loading"
      class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-if="posts.length === 0"
        class="col-span-full text-center py-8 text-gray-500"
      >
        <UIcon
          name="i-heroicons-photo"
          class="w-12 h-12 mx-auto mb-2"
        />
        <p>No images found. Upload some images to get started!</p>
      </div>

      <!-- Admin Shared Images Section -->
      <div
        v-if="posts.some(post => post.isAdminShared)"
        class="col-span-full mb-6"
      >
        <div class="flex items-center gap-2 mb-4">
          <UIcon
            name="i-heroicons-users"
            class="text-success-500"
          />
          <h3 class="text-lg font-semibold text-success-700 dark:text-success-400">
            Admin Shared Images
          </h3>
          <UBadge
            color="success"
            variant="soft"
          >
            Available to all users
          </UBadge>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard
            v-for="(post, index) in posts.filter(p => p.isAdminShared)"
            :key="'admin-' + index"
            class="overflow-hidden border-success-200 dark:border-success-800"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-medium truncate">
                    {{ post.title }}
                  </h3>
                  <UBadge
                    color="success"
                    variant="soft"
                    size="xs"
                  >
                    Shared
                  </UBadge>
                </div>
                <UButton
                  v-if="storeUser.user?.role === 'admin'"
                  icon="i-heroicons-x-mark"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="removePost(posts.indexOf(post))"
                >
                  Remove
                </UButton>
              </div>
            </template>

            <div class="space-y-2">
              <img
                v-if="post.image?.src"
                :src="post.image.src"
                :alt="post.title"
                class="w-full h-32 object-cover rounded"
              >
              <p class="text-sm text-gray-600">
                {{ post.description }}
              </p>
              <p class="text-xs text-gray-400">
                {{ new Date(post.date).toLocaleDateString() }}
              </p>
              <div
                v-if="post.s3Url"
                class="text-xs text-green-600 font-mono truncate cursor-pointer"
                :title="post.s3Url"
                @click="copyToClipboard(post.s3Url)"
              >
                🔗 Click to copy URL
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- User Personal Images Section -->
      <div
        v-if="posts.some(post => !post.isAdminShared)"
        class="col-span-full"
      >
        <div
          v-if="posts.some(post => post.isAdminShared)"
          class="flex items-center gap-2 mb-4"
        >
          <UIcon
            name="i-heroicons-user"
            class="text-primary-500"
          />
          <h3 class="text-lg font-semibold text-primary-700 dark:text-primary-400">
            Your Personal Images
          </h3>
          <UBadge
            color="primary"
            variant="soft"
          >
            Personal only
          </UBadge>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard
            v-for="(post, index) in posts.filter(p => !p.isAdminShared)"
            :key="'user-' + index"
            class="overflow-hidden"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium truncate">
                  {{ post.title }}
                </h3>
                <UButton
                  icon="i-heroicons-x-mark"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="removePost(posts.indexOf(post))"
                >
                  Remove
                </UButton>
              </div>
            </template>

            <div class="space-y-2">
              <img
                v-if="post.image?.src"
                :src="post.image.src"
                :alt="post.title"
                class="w-full h-32 object-cover rounded"
              >
              <p class="text-sm text-gray-600">
                {{ post.description }}
              </p>
              <p class="text-xs text-gray-400">
                {{ new Date(post.date).toLocaleDateString() }}
              </p>
              <div
                v-if="post.s3Url"
                class="text-xs text-green-600 font-mono truncate cursor-pointer"
                :title="post.s3Url"
                @click="copyToClipboard(post.s3Url)"
              >
                🔗 Click to copy URL
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
