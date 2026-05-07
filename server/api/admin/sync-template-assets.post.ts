import fs from 'fs/promises'
import path from 'path'
import { s3Service } from '../services/s3.service'

const ASSETS_DIR = path.resolve(process.cwd(), 'app/assets')
const MAP_FILE = path.resolve(ASSETS_DIR, 'template-assets-map.json')
const FOLDER = 'admin/shared/template-assets'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'No autorizado. Debe iniciar sesion para sincronizar assets.'
      })
    }

    if (user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        message: 'Se requiere rol de administrador para sincronizar assets.'
      })
    }

    let files: string[] = []
    try {
      files = await fs.readdir(ASSETS_DIR)
    } catch (err: any) {
      throw createError({
        statusCode: 500,
        message: 'Error leyendo directorio de assets: ' + err.message
      })
    }

    const targetFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.b64'))

    const map: Record<string, string> = {}
    let uploaded = 0
    const errors: string[] = []

    for (const fileName of targetFiles) {
      const filePath = path.join(ASSETS_DIR, fileName)
      const content = await fs.readFile(filePath, 'utf-8')

      let dataUrl: string | null = null

      const match = content.match(/data:image\/png;base64,[^"'\s`]+/)
      if (match) {
        dataUrl = match[0]
      }

      if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
        errors.push(`Skipped ${fileName}: no valid base64 PNG data URL found`)
        continue
      }

      const base64Data = dataUrl.replace('data:image/png;base64,', '')
      let buffer: Buffer
      try {
        buffer = Buffer.from(base64Data, 'base64')
      } catch (err: any) {
        errors.push(`Skipped ${fileName}: invalid base64 content`)
        continue
      }

      if (buffer.length === 0) {
        errors.push(`Skipped ${fileName}: decoded buffer is empty`)
        continue
      }

      const nameWithoutExt = path.basename(fileName, path.extname(fileName))
      const outputFileName = `${nameWithoutExt}.png`

      try {
        const { url } = await s3Service.uploadFile({
          file: buffer,
          fileName: outputFileName,
          contentType: 'image/png',
          folder: FOLDER
        })
        map[fileName] = url
        uploaded++
      } catch (err: any) {
        errors.push(`Failed ${fileName}: ${err.message || err}`)
      }
    }

    await fs.writeFile(MAP_FILE, JSON.stringify(map, null, 2))

    return {
      success: true,
      uploaded,
      total: targetFiles.length,
      map,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error: any) {
    console.error('Error syncing template assets:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al sincronizar assets de templates.'
    })
  }
})
