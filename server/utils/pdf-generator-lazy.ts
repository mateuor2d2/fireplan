// server/utils/pdf-generator-lazy.ts
/**
 * Lazy-loaded PDF generator utility
 *
 * This module provides lazy loading for pdfmake to avoid bundling
 * the heavy PDF library in the initial server bundle.
 *
 * PDF generation is on-demand, so we load pdfmake only when needed.
 */
import type { TDocumentDefinitions } from 'pdfmake/interfaces'

// Cache for loaded modules
let pdfMakeInstance: any = null
let pdfMakeInitialized = false

/**
 * Lazy load pdfMake and vfs_fonts modules
 * Caches the result for subsequent calls
 */
async function loadPdfMake() {
  if (pdfMakeInitialized && pdfMakeInstance) {
    return pdfMakeInstance
  }

  try {
    // Dynamic imports - works with both bundled and externalized pdfmake
    const pdfMakeModule = await import('pdfmake/build/pdfmake.js')
    const pdfFonts = await import('pdfmake/build/vfs_fonts.js')
    
    // Handle both ESM (.default) and CJS (direct) exports
    const pdfMakeLib = pdfMakeModule.default || pdfMakeModule
    const fontsModule = pdfFonts.default || pdfFonts

    // vfs_fonts.js assigns to window.pdfMake.vfs in browser, 
    // but when externalized in Node.js, we need to find vfs differently
    let vfs = null
    
    // Try various export patterns
    if (fontsModule.pdfMake?.vfs) {
      // Standard browser pattern
      vfs = fontsModule.pdfMake.vfs
    } else if (fontsModule.vfs) {
      // Direct vfs export (common in Node.js)
      vfs = fontsModule.vfs
    } else if (typeof fontsModule === 'object') {
      // When externalized, vfs might be the whole module
      // Check if it looks like a vfs object (has font file keys)
      const keys = Object.keys(fontsModule)
      const hasFontFiles = keys.some(k => k.endsWith('.ttf') || k.endsWith('.woff'))
      if (hasFontFiles) {
        vfs = fontsModule
      }
    }

    if (!vfs) {
      console.error('[PDF Lazy Loader] vfs_fonts structure:', Object.keys(fontsModule))
      console.error('[PDF Lazy Loader] pdfFonts keys:', Object.keys(pdfFonts))
      throw new Error('Could not find vfs fonts in pdfmake vfs_fonts module')
    }

    // Assign vfs to pdfMake instance
    pdfMakeLib.vfs = vfs

    // Set font configuration - vfs_fonts.js contains Roboto fonts
    const fontConfig = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    }
    pdfMakeLib.fonts = fontConfig

    pdfMakeInstance = pdfMakeLib
    pdfMakeInitialized = true

    console.log('[PDF Lazy Loader] pdfMake initialized with fonts, vfs entries:', Object.keys(vfs).length)
    return pdfMakeLib
  } catch (error) {
    console.error('[PDF Lazy Loader] Error initializing pdfMake:', error)
    throw error
  }
}

/**
 * Generate a PDF buffer from document definitions using lazy-loaded pdfMake
 *
 * @param docDefinition - pdfMake document definition
 * @returns Promise<Buffer> - PDF file as buffer
 */
export async function generatePdfLazy(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  const pdfMake = await loadPdfMake()

  if (!pdfMake || !pdfMake.createPdf) {
    throw new Error('PDF generation library not properly initialized')
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition, null, pdfMake.fonts)

      pdfDoc.getBuffer((buffer: Buffer) => {
        if (buffer) {
          console.log(`[PDF Lazy Loader] PDF buffer created successfully, size: ${buffer.length} bytes`)
          resolve(buffer)
        } else {
          reject(new Error('Failed to generate PDF: No buffer returned'))
        }
      })
    } catch (error: any) {
      console.error('[PDF Lazy Loader] Error creating PDF:', error)
      reject(error)
    }
  })
}

/**
 * Get the initialized pdfMake instance for advanced usage
 * Loads pdfMake if not already loaded
 */
export async function getPdfMakeInstance() {
  return loadPdfMake()
}

/**
 * Check if pdfMake has been initialized
 */
export function isPdfMakeInitialized(): boolean {
  return pdfMakeInitialized
}

/**
 * Reset the pdfMake cache (useful for testing)
 */
export function resetPdfMakeCache(): void {
  pdfMakeInstance = null
  pdfMakeInitialized = false
}
