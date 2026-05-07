import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { s3Service } from '../server/api/services/s3.service'

const __dirname = import.meta.dirname || path.dirname(new URL(import.meta.url).pathname)

// Mock createError for standalone script execution
if (typeof (globalThis as any).createError === 'undefined') {
  (globalThis as any).createError = (opts: { statusCode?: number, message?: string }) => {
    const err = new Error(opts.message || 'Unknown error') as Error & { statusCode: number, statusMessage: string }
    err.statusCode = opts.statusCode || 500
    err.statusMessage = opts.message || 'Unknown error'
    return err
  }
}

const ASSETS_DIR = path.resolve(__dirname, '../app/assets')
const MAP_FILE = path.resolve(ASSETS_DIR, 'template-assets-map.json')
const FOLDER = 'admin/shared/template-assets'

async function main() {
  console.log('📁 Scanning for .js and .b64 assets in', ASSETS_DIR)

  let files: string[] = []
  try {
    files = await fs.readdir(ASSETS_DIR)
  } catch (err: any) {
    console.error('❌ Failed to read assets directory:', err.message)
    process.exit(1)
  }

  const targetFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.b64'))
  console.log(`🎯 Found ${targetFiles.length} target files`)

  const map: Record<string, string> = {}
  let uploaded = 0

  for (const fileName of targetFiles) {
    const filePath = path.join(ASSETS_DIR, fileName)
    const content = await fs.readFile(filePath, 'utf-8')

    let dataUrl: string | null = null

    const match = content.match(/data:image\/png;base64,[^"'\s`]+/)
    if (match) {
      dataUrl = match[0]
    }

    if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
      console.error(`⚠️  Skipping ${fileName}: no valid base64 PNG data URL found`)
      continue
    }

    const base64Data = dataUrl.replace('data:image/png;base64,', '')
    let buffer: Buffer
    try {
      buffer = Buffer.from(base64Data, 'base64')
    } catch (err) {
      console.error(`⚠️  Skipping ${fileName}: invalid base64 content`)
      continue
    }

    if (buffer.length === 0) {
      console.error(`⚠️  Skipping ${fileName}: decoded buffer is empty`)
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
      console.log(`✅ Uploaded ${fileName} -> ${url}`)
    } catch (err: any) {
      console.error(`❌ Failed to upload ${fileName}:`, err.message || err)
    }
  }

  await fs.writeFile(MAP_FILE, JSON.stringify(map, null, 2))
  console.log(`\n🎉 Done. Uploaded ${uploaded}/${targetFiles.length} files. Map saved to ${MAP_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
