import type { Ref } from 'vue'

export interface UploadedFile {
  key: string
  url: string
  originalName: string
  size: number
  mimeType: string
}

export interface UploadOptions {
  onProgress?: (progress: number) => void
  metadata?: Record<string, string>
  folder?: string
  public?: boolean
}

export const useS3 = () => {
  const { $api } = useNuxtApp()

  /**
   * Upload a file to S3
   */
  const uploadFile = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadedFile> => {
    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Add metadata if provided
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      // Determine endpoint based on public flag
      const endpoint = options.public ? '/api/public/s3/upload' : '/api/s3/upload'

      // Upload the file
      const response = await $fetch(endpoint, {
        method: 'POST',
        body: formData,
        // Handle upload progress
        onResponseError: (context) => {
          throw new Error(context.response?._data?.message || 'Error al subir el archivo')
        }
      })

      return response.data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  /**
   * Get a signed URL for a file
   */
  const getFileUrl = async (key: string): Promise<string> => {
    try {
      const response = await $fetch(`/api/s3/${encodeURIComponent(key)}`)
      return response.data.url
    } catch (error) {
      console.error('Error getting file URL:', error)
      throw error
    }
  }

  /**
   * Delete a file from S3
   */
  const deleteFile = async (key: string): Promise<void> => {
    try {
      await $fetch(`/api/s3/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  return {
    uploadFile,
    getFileUrl,
    deleteFile
  }
}

// Make it available for auto-import
export default useS3

/**
 * Composable for public S3 uploads (no authentication required)
 * Automatically routes to the public S3 upload endpoint
 */
export const usePublicS3 = () => {
  const s3 = useS3()

  return {
    /**
     * Upload a file using the public endpoint (no auth required)
     */
    uploadFile: async (file: File, options: Omit<UploadOptions, 'public'> = {}): Promise<UploadedFile> => {
      return s3.uploadFile(file, { ...options, public: true })
    },
    getFileUrl: s3.getFileUrl,
    deleteFile: s3.deleteFile
  }
}
