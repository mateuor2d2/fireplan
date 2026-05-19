/**
 * Image Compression Utility
 *
 * Provides image compression and size optimization for PDF generation
 * to ensure images don't exceed pdfmake's size limitations.
 *
 * Sharp is an optional dependency - the utility gracefully degrades
 * to return original images when sharp is not available.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SharpFunction = (input: Buffer) => any

// Cache the sharp module reference
let sharpModule: SharpFunction | null | undefined = undefined

/**
 * Dynamically loads the sharp module if available
 * @returns The sharp function or null if not available
 */
async function loadSharp(): Promise<SharpFunction | null> {
  if (sharpModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const sharpImport = await import('sharp')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      sharpModule = sharpImport.default
      void('[Image Compression] Sharp module loaded successfully')
    } catch {
      console.warn('[Image Compression] Sharp not available, images will not be optimized')
      sharpModule = null
    }
  }
  return sharpModule
}

/**
 * Checks if sharp is available for image processing
 * @returns boolean True if sharp is available
 */
export function isSharpAvailable(): boolean {
  return sharpModule !== null && sharpModule !== undefined
}

/**
 * Gets image metadata if sharp is available
 * @param imageBuffer The image buffer
 * @returns Image metadata or null if sharp unavailable
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<{
  width?: number
  height?: number
  format?: string
  sizeKB: number
} | null> {
  const sharp = await loadSharp()

  if (!sharp) {
    return null
  }

  try {
    const metadata = await sharp(imageBuffer).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      sizeKB: Math.round(imageBuffer.length / 1024)
    }
  } catch {
    return null
  }
}

/**
 * Compresses an image buffer to reduce file size while maintaining quality
 * @param imageBuffer The original image buffer
 * @param options Compression options
 * @returns Promise<Buffer> The compressed image buffer (or original if sharp unavailable)
 */
export async function compressImage(
  imageBuffer: Buffer,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
    maxSizeKB?: number
  } = {}
): Promise<Buffer> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 80,
    format = 'jpeg',
    maxSizeKB = 200 // Default max size in KB
  } = options

  const sharp = await loadSharp()

  // If sharp is not available, return the original buffer
  if (!sharp) {
    void('[Image Compression] Sharp unavailable, returning original image')
    return imageBuffer
  }

  try {
    console.log(`[Image Compression] Starting compression: ${imageBuffer.length} bytes`)

    let sharpInstance = sharp(imageBuffer)

    // Get original image metadata
    const metadata = await sharpInstance.metadata()
    console.log(`[Image Compression] Original metadata:`, {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      sizeKB: Math.round(imageBuffer.length / 1024)
    })

    // Resize if image is larger than max dimensions
    if (metadata.width && metadata.height) {
      const needsResize = metadata.width > maxWidth || metadata.height > maxHeight

      if (needsResize) {
        // Calculate new dimensions maintaining aspect ratio
        let newWidth = metadata.width
        let newHeight = metadata.height

        if (metadata.width > maxWidth) {
          newWidth = maxWidth
          newHeight = Math.round((metadata.height * maxWidth) / metadata.width)
        }

        if (newHeight > maxHeight) {
          newHeight = maxHeight
          newWidth = Math.round((newWidth * maxHeight) / newHeight)
        }

        console.log(`[Image Compression] Resizing from ${metadata.width}x${metadata.height} to ${newWidth}x${newHeight}`)

        sharpInstance = sharpInstance.resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }

    // Convert to target format with compression
    let compressedBuffer: Buffer

    switch (format) {
      case 'jpeg':
        compressedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true })
          .toBuffer()
        break
      case 'png':
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer()
        break
      case 'webp':
        compressedBuffer = await sharpInstance
          .webp({ quality, effort: 6 })
          .toBuffer()
        break
      default:
        compressedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true })
          .toBuffer()
    }

    console.log(`[Image Compression] Compression completed: ${compressedBuffer.length} bytes`)

    // Check if we need to compress further to meet size requirements
    const currentSizeKB = compressedBuffer.length / 1024
    if (currentSizeKB > maxSizeKB) {
      console.log(`[Image Compression] Image still too large (${currentSizeKB}KB > ${maxSizeKB}KB), reducing quality`)

      // Try with lower quality
      const lowerQuality = Math.max(quality - 20, 20)
      return await compressImage(imageBuffer, {
        ...options,
        quality: lowerQuality
      })
    }

    return compressedBuffer
  } catch (error) {
    console.error(`[Image Compression] Error compressing image:`, error)
    // Return original buffer if compression fails
    return imageBuffer
  }
}

/**
 * Converts an image buffer to base64 with compression
 * @param imageBuffer The original image buffer
 * @param options Compression options
 * @returns Promise<string> The base64 data URL
 */
export async function compressImageToBase64(
  imageBuffer: Buffer,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
    maxSizeKB?: number
  } = {}
): Promise<string> {
  try {
    const compressedBuffer = await compressImage(imageBuffer, options)

    // Determine format and MIME type
    const format = options.format || 'jpeg'
    const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`

    // Convert to base64
    const base64 = compressedBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    console.log(`[Image Compression] Created base64 data URL: ${dataUrl.length} characters (${Math.round(compressedBuffer.length / 1024)}KB)`)

    return dataUrl
  } catch (error) {
    console.error(`[Image Compression] Error creating compressed base64:`, error)
    console.error(`[Image Compression] Error details:`, {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    })

    // Fallback to original buffer as base64
    try {
      const base64 = imageBuffer.toString('base64')
      const fallbackUrl = `data:image/jpeg;base64,${base64}`
      console.log(`[Image Compression] ✅ Fallback base64 conversion successful: ${fallbackUrl.length} characters`)
      return fallbackUrl
    } catch (fallbackError) {
      console.error(`[Image Compression] Even fallback conversion failed:`, fallbackError)
      throw error // Re-throw original error
    }
  }
}

/**
 * Validates if an image buffer needs compression
 * @param imageBuffer The image buffer
 * @param maxSizeKB Maximum size in KB
 * @returns boolean True if compression is needed
 */
export function needsCompression(imageBuffer: Buffer, maxSizeKB: number = 200): boolean {
  const sizeKB = imageBuffer.length / 1024
  return sizeKB > maxSizeKB
}

/**
 * Gets optimal compression settings based on image size and use case
 * @param originalSizeKB Original image size in KB
 * @param useCase The use case (e.g., 'pdf', 'web', 'thumbnail')
 * @returns Compression options
 */
export function getOptimalCompressionSettings(
  originalSizeKB: number,
  useCase: 'pdf' | 'web' | 'thumbnail' = 'pdf'
): {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'jpeg' | 'png' | 'webp'
  maxSizeKB: number
} {
  switch (useCase) {
    case 'pdf':
      if (originalSizeKB > 1000) {
        // Large images (>1MB)
        return {
          maxWidth: 600,
          maxHeight: 450,
          quality: 70,
          format: 'jpeg',
          maxSizeKB: 150
        }
      } else if (originalSizeKB > 500) {
        // Medium images (500KB-1MB)
        return {
          maxWidth: 800,
          maxHeight: 600,
          quality: 80,
          format: 'jpeg',
          maxSizeKB: 200
        }
      } else {
        // Small images (<500KB)
        return {
          maxWidth: 800,
          maxHeight: 600,
          quality: 85,
          format: 'jpeg',
          maxSizeKB: 250
        }
      }

    case 'web':
      return {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 80,
        format: 'webp',
        maxSizeKB: 300
      }

    case 'thumbnail':
      return {
        maxWidth: 200,
        maxHeight: 150,
        quality: 75,
        format: 'jpeg',
        maxSizeKB: 50
      }

    default:
      return {
        maxWidth: 800,
        maxHeight: 600,
        quality: 80,
        format: 'jpeg',
        maxSizeKB: 200
      }
  }
}
