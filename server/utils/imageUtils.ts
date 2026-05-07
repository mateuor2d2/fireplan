import { fetch } from 'node-fetch-native'
import { s3Service } from '../api/services/s3.service'

function extractS3KeyFromUrl(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl)
    const virtualHostMatch = url.hostname.match(/^([^.]+)\.s3[.-]([^.]+)\.amazonaws\.com$/)
    if (virtualHostMatch) {
      const key = url.pathname.substring(1)
      return key || null
    }
    const pathStyleMatch = url.hostname.match(/^s3[.-]([^.]+)\.amazonaws\.com$/)
    if (pathStyleMatch) {
      const pathParts = url.pathname.split('/').filter(p => p.length > 0)
      if (pathParts.length >= 2) {
        const [, ...keyParts] = pathParts
        return keyParts.join('/')
      }
    }
    return null
  } catch {
    return null
  }
}

function extractProxyKeyFromUrl(proxyUrl: string): string | null {
  try {
    const url = new URL(proxyUrl)
    if (url.pathname.endsWith('/api/images/proxy')) {
      return url.searchParams.get('key')
    }
    return null
  } catch {
    return null
  }
}

const CONTENT_TYPE_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp'
}

function getContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() || 'jpg'
  return CONTENT_TYPE_MAP[ext] || 'image/jpeg'
}

function bufferToDataUrl(buffer: Buffer, key: string): string {
  const contentType = getContentType(key)
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

const TIMEOUT_MS = 5000

/**
 * Converts an external image URL to a base64 data URL.
 * Fast-fail: tries S3 direct first, then proxy, then HTTP fetch.
 * Returns original URL if all methods fail.
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('data:')) return url
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url

  // Strategy 1: Proxy URL → direct S3 download
  const proxyKey = extractProxyKeyFromUrl(url)
  if (proxyKey) {
    try {
      const buffer = await withTimeout(s3Service.downloadFile(proxyKey), TIMEOUT_MS)
      return bufferToDataUrl(buffer, proxyKey)
    } catch { /* fallthrough */ }
  }

  // Strategy 2: S3 signed URL → extract key → direct S3 download
  if (url.includes('.amazonaws.com')) {
    const s3Key = extractS3KeyFromUrl(url)
    if (s3Key) {
      try {
        const buffer = await withTimeout(s3Service.downloadFile(s3Key), TIMEOUT_MS)
        return bufferToDataUrl(buffer, s3Key)
      } catch { /* fallthrough */ }
    }
  }

  // Strategy 3: HTTP fetch with timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageFetcher/1.0)' }
    })
    clearTimeout(timeoutId)

    if (!response.ok) return url

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) return url

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength === 0) return url

    const buffer = Buffer.from(arrayBuffer)
    let actualContentType = contentType
    if (contentType.includes('octet-stream')) {
      const ext = url.toLowerCase().split('.').pop()
      actualContentType = CONTENT_TYPE_MAP[ext || ''] || 'image/png'
    }
    return `data:${actualContentType};base64,${buffer.toString('base64')}`
  } catch {
    return url
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) }
    )
  })
}

/**
 * Extracts all external image URLs from HTML content
 */
export function extractImageUrls(htmlContent: string): string[] {
  const urls: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const url = match[1]
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      urls.push(url)
    }
  }
  return Array.from(new Set(urls))
}

/**
 * Replaces image URLs in HTML content with base64 data URLs
 */
export async function convertImagesToBase64(htmlContent: string): Promise<string> {
  const imageUrls = extractImageUrls(htmlContent)
  if (imageUrls.length === 0) return htmlContent

  const CONCURRENCY_LIMIT = 5
  const urlToBase64Map = new Map<string, string>()

  for (let i = 0; i < imageUrls.length; i += CONCURRENCY_LIMIT) {
    const batch = imageUrls.slice(i, i + CONCURRENCY_LIMIT)
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const base64 = await imageUrlToBase64(url)
        urlToBase64Map.set(url, base64)
      })
    )
    // Log only failures
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.error(`[Image Conversion] Failed: ${batch[idx].substring(0, 80)}...`)
      }
    })
  }

  let processedContent = htmlContent
  let replaced = 0
  for (const [url, base64] of urlToBase64Map) {
    if (base64 !== url && base64.startsWith('data:')) {
      // Direct string replacement
      if (processedContent.includes(url)) {
        processedContent = processedContent.replace(url, base64)
        replaced++
      }
    } else {
      console.warn(`[Image Conversion] Could not convert: ${url.substring(0, 80)}...`)
    }
  }

  console.log(`[Image Conversion] ${replaced}/${imageUrls.length} images converted`)
  return processedContent
}
