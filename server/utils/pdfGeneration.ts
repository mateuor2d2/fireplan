// server/utils/pdfGeneration.ts
/**
 * Shared PDF generation utilities
 * 
 * This module provides centralized PDF generation functionality
 * used by both the authenticated generate-pdf endpoint and
 * the public download endpoint.
 */

import { marked } from 'marked'
import { parse } from 'node-html-parser'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { convertImagesToBase64, imageUrlToBase64 } from './imageUtils'
import { preprocessTemplateImages } from './templateImageProcessor'
import { generatePdfLazy } from './pdf-generator-lazy'

// Import template renderers
import {
  renderTemplate,
  extractVariables,
  validateTemplateData
} from '~/utils/templateRenderer'
import { renderTemplateSimple } from '~/utils/templateRendererSimple'
import { renderTemplateMinimal } from '~/utils/templateRendererMinimal'

// =======================================================================
// TYPES AND INTERFACES
// =======================================================================

export interface PdfGenerationContext {
  imageDataCache: Map<string, ImageData>
  processingStats: {
    imagesProcessed: number
    tablesProcessed: number
    errors: string[]
  }
}

interface ImageData {
  url: string
  alt: string
  width: number
  height: number
  alignment: 'center' | 'left' | 'right'
  isValid: boolean
  error?: string
}

interface DocumentSection {
  type: 'header' | 'introduction' | 'detallesGraficos' | 'mainContent' | 'conclusion' | 'generic'
  elements: any[]
}

export interface PdfGenerationOptions {
  skipPaymentCheck?: boolean
  skipQRGeneration?: boolean
}

// =======================================================================
// IMAGE PROCESSING PIPELINE
// =======================================================================

class ImageProcessingPipeline {
  private context: PdfGenerationContext

  constructor(context: PdfGenerationContext) {
    this.context = context
  }

  async processImagesFromTemplate(templateData: any): Promise<{ detallesGraficos: any[], imagePlaceholders: string[] }> {
    const imagePlaceholders: string[] = []

    try {
      const images = templateData.det_graf || []
      void(`[Image Pipeline] 📸 Processing ${images.length} images from template data`)

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const placeholder = `__IMG_PLACEHOLDER_${i}__`
        imagePlaceholders.push(placeholder)

        void(`[Image Pipeline] 📸 Processing image ${i}: ${img.name}, placeholder: ${placeholder}`)

        const imageData = await this.processSingleImage(img, i)
        this.context.imageDataCache.set(placeholder, imageData)
      }

      this.context.processingStats.imagesProcessed = images.length
      return { detallesGraficos: imagePlaceholders, imagePlaceholders }
    } catch (error: any) {
      console.error('[Image Pipeline] ❌ Error processing images:', error)
      this.context.processingStats.errors.push(`Image processing error: ${error.message}`)
      return { detallesGraficos: [], imagePlaceholders: [] }
    }
  }

  private async processSingleImage(img: any, index: number): Promise<ImageData> {
    const imageData: ImageData = {
      url: '',
      alt: img.name || `Imagen ${index + 1}`,
      width: 400,
      height: 300,
      alignment: 'center',
      isValid: false,
      error: undefined
    }

    try {
      if (!img || img.url === undefined || img.url === null || img.url === '') {
        imageData.error = 'No URL provided'
        return imageData
      }

      let base64Url = img.url

      if (!img.url.startsWith('data:')) {
        try {
          base64Url = await imageUrlToBase64(img.url)
        } catch (conversionError: any) {
          imageData.error = `Conversion failed: ${conversionError.message}`
          return imageData
        }
      }

      const validation = this.validateImageForPdfmake(base64Url)
      if (validation.isValid) {
        imageData.url = validation.url
        imageData.isValid = true
      } else {
        imageData.error = validation.error
      }
    } catch (error: any) {
      imageData.error = `Processing error: ${error.message}`
    }

    return imageData
  }

  private validateImageForPdfmake(imageUrl: string | undefined | null): { url: string, isValid: boolean, error?: string } {
    if (imageUrl === undefined || imageUrl === null || imageUrl === '') {
      return { url: imageUrl || '', isValid: false, error: 'Empty image URL' }
    }

    if (imageUrl.startsWith('data:')) {
      const cleanImageUrl = imageUrl.replace(/\s+/g, '').trim()
      const dataUrlMatch = cleanImageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/)

      if (!dataUrlMatch) {
        return { url: cleanImageUrl, isValid: false, error: 'Invalid base64 format' }
      }

      const [, mimeType, base64Data] = dataUrlMatch
      const base64Length = base64Data.length
      const maxBase64Length = 500 * 1024

      if (base64Length > maxBase64Length) {
        return { url: cleanImageUrl, isValid: false, error: 'Image too large' }
      }

      if (base64Length < 50) {
        return { url: cleanImageUrl, isValid: false, error: 'Base64 data too short' }
      }

      return { url: cleanImageUrl, isValid: true }
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return { url: imageUrl, isValid: true }
    }

    return { url: imageUrl, isValid: false, error: 'Unsupported URL format' }
  }

  generateImagePdfObjects(): any[] {
    const pdfObjects: any[] = []

    for (let i = 0; i < 1000; i++) {
      const placeholder = `__IMG_PLACEHOLDER_${i}__`
      const imageData = this.context.imageDataCache.get(placeholder)

      if (imageData && imageData.isValid) {
        pdfObjects.push(
          {
            image: imageData.url,
            alignment: imageData.alignment,
            width: imageData.width,
            height: imageData.height,
            margin: [0, 10, 0, 10]
          },
          {
            text: imageData.alt,
            fontSize: 12,
            alignment: imageData.alignment,
            margin: [0, 0, 0, 15],
            color: '#666'
          }
        )
      } else if (imageData && imageData.error) {
        pdfObjects.push({
          text: `[Error: ${imageData.error}]`,
          alignment: 'center',
          fontSize: 10,
          margin: [0, 10, 0, 10],
          color: 'red'
        })
      }
    }

    return pdfObjects
  }
}

// =======================================================================
// TABLE PROCESSING PIPELINE
// =======================================================================

class TableProcessingPipeline {
  private context: PdfGenerationContext

  constructor(context: PdfGenerationContext) {
    this.context = context
  }

  processTables(htmlContent: string): { processedHtml: string, tableCount: number } {
    try {
      const tableMatches = htmlContent.match(/<table[^>]*>[\s\S]*?<\/table>/gi)
      const tableCount = tableMatches ? tableMatches.length : 0

      void(`[Table Pipeline] Processing ${tableCount} tables from HTML content`)
      this.context.processingStats.tablesProcessed = tableCount

      return { processedHtml: htmlContent, tableCount }
    } catch (error: any) {
      console.error('[Table Pipeline] Error processing tables:', error)
      this.context.processingStats.errors.push(`Table processing error: ${error.message}`)
      return { processedHtml: htmlContent, tableCount: 0 }
    }
  }

  generateTablePdfObject(tableElement: any): any {
    const tableBody: any[] = []
    const rows = tableElement.querySelectorAll('tr')

    rows.forEach((row: any) => {
      const rowData: any[] = []
      const cells = row.querySelectorAll('td, th')
      cells.forEach((cell: any) => {
        rowData.push(cell.text || '')
      })
      tableBody.push(rowData)
    })

    return {
      table: {
        body: tableBody
      },
      margin: [0, 10, 0, 10]
    }
  }
}

// =======================================================================
// HTML CONTENT PIPELINE
// =======================================================================

class HtmlContentPipeline {
  private context: PdfGenerationContext
  private imagePipeline: ImageProcessingPipeline
  private tablePipeline: TableProcessingPipeline

  constructor(context: PdfGenerationContext, imagePipeline: ImageProcessingPipeline, tablePipeline: TableProcessingPipeline) {
    this.context = context
    this.imagePipeline = imagePipeline
    this.tablePipeline = tablePipeline
  }

  parseHtmlToPdfContent(htmlContent: string, title: string): TDocumentDefinitions {
    const processedContent = this.processPdfmakeMarkersInHtml(htmlContent)
    const content: any[] = []

    content.push({
      text: title,
      fontSize: 24,
      bold: true,
      margin: [0, 0, 0, 20]
    })

    const root = parse(processedContent)
    const elements = root.childNodes

    const sections = this.identifyDocumentSections(elements)

    sections.forEach((section) => {
      switch (section.type) {
        case 'header':
          this.processHeaderSection(section, content)
          break
        case 'introduction':
          this.processIntroductionSection(section, content)
          break
        case 'detallesGraficos':
          this.processDetallesGraficosSection(section, content)
          break
        case 'mainContent':
          this.processMainContentSection(section, content)
          break
        case 'conclusion':
          this.processConclusionSection(section, content)
          break
        default:
          this.processGenericSection(section, content)
      }
    })

    return {
      content: content,
      styles: this.generateStyles(),
      defaultStyle: {
        font: 'Roboto',
        columnGap: 20
      },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60]
    } as TDocumentDefinitions
  }

  private processPdfmakeMarkersInHtml(htmlContent: string): string {
    const markerRegex = /__PDFMAKE_OBJECT_START__(.+?)__PDFMAKE_OBJECT_END__/g
    const matches = [...htmlContent.matchAll(markerRegex)]

    void(`[🖼️ MARKERS] Found ${matches.length} PDFmake image markers to process`)

    if (matches.length > 0) {
      let processedContent = htmlContent

      matches.forEach((match) => {
        const fullMatch = match[0]
        const jsonContent = match[1]
        const replacement = `<pdfmake-object data='${encodeURIComponent(jsonContent)}'></pdfmake-object>`
        processedContent = processedContent.replace(fullMatch, replacement)
      })

      return processedContent
    }

    return htmlContent
  }

  private identifyDocumentSections(elements: any[]): DocumentSection[] {
    const sections: DocumentSection[] = []
    let currentSection: DocumentSection | null = null
    let sectionStartIndex = 0

    elements.forEach((element, index) => {
      const elementType = this.getElementType(element)
      const sectionType = this.determineSectionType(element, elementType)

      if (sectionType && currentSection && currentSection.type !== sectionType) {
        currentSection.elements = elements.slice(sectionStartIndex, index)
        sections.push(currentSection)
        currentSection = { type: sectionType, elements: [] }
        sectionStartIndex = index
      } else if (sectionType && !currentSection) {
        currentSection = { type: sectionType, elements: [] }
        sectionStartIndex = index
      }
    })

    if (currentSection) {
      currentSection.elements = elements.slice(sectionStartIndex)
      sections.push(currentSection)
    }

    if (sections.length === 0) {
      sections.push({
        type: 'generic',
        elements: elements
      })
    }

    return sections
  }

  private getElementType(element: any): string {
    if (element.nodeType === 3) return 'text'
    if (!element.tagName) return 'unknown'
    return element.tagName.toLowerCase()
  }

  private determineSectionType(element: any, elementType: string): DocumentSection['type'] | null {
    if (elementType === 'h1' || elementType === 'h2') {
      const text = (element.textContent || '').toLowerCase()

      if (text.includes('detalles gráficos') || text.includes('detalles graficos')) {
        return 'detallesGraficos'
      }
      if (text.includes('memoria') || text.includes('descripción') || text.includes('introducción')) {
        return 'introduction'
      }
      if (text.includes('conclusión') || text.includes('conclusion')) {
        return 'conclusion'
      }
      if (text.includes('análisis') || text.includes('desarrollo') || text.includes('contenido')) {
        return 'mainContent'
      }
      return 'header'
    }

    if (elementType === 'div') {
      const className = element.classNames || ''
      if (className.includes('detalles') || className.includes('graficos')) {
        return 'detallesGraficos'
      }
    }

    return null
  }

  private processHeaderSection(section: DocumentSection, content: any[]): void {
    section.elements.forEach((element) => {
      const processed = this.processElementForPdf(element)
      if (processed) {
        content.push(processed)
      }
    })
  }

  private processIntroductionSection(section: DocumentSection, content: any[]): void {
    content.push({
      text: '',
      margin: [0, 10, 0, 5]
    })

    section.elements.forEach((element) => {
      const processed = this.processElementForPdf(element)
      if (processed) {
        content.push(processed)
      }
    })
  }

  private processDetallesGraficosSection(section: DocumentSection, content: any[]): void {
    content.push({
      text: 'Detalles Gráficos',
      fontSize: 18,
      bold: true,
      margin: [0, 20, 0, 15],
      color: '#2c3e50'
    })

    section.elements.forEach((element) => {
      const processed = this.processElementForPdf(element)
      if (processed) {
        content.push(processed)
      }
    })
  }

  private processMainContentSection(section: DocumentSection, content: any[]): void {
    section.elements.forEach((element) => {
      const processed = this.processElementForPdf(element)
      if (processed) {
        content.push(processed)
      }
    })
  }

  private processConclusionSection(section: DocumentSection, content: any[]): void {
    section.elements.forEach((element) => {
      const processed = this.processElementForPdf(element)
      if (processed) {
        content.push(processed)
      }
    })
  }

  private processGenericSection(section: DocumentSection, content: any[]): void {
    section.elements.forEach((element) => {
      const processed = this.processElementForPdf(element)
      if (processed) {
        content.push(processed)
      }
    })
  }

  private processElementForPdf(element: any): any {
    if (element.nodeType === 3) {
      const text = element.textContent || ''
      if (text.trim()) {
        const pdfmakeObject = this.tryParsePdfmakeObject(text)
        if (pdfmakeObject) {
          return pdfmakeObject
        }

        const placeholderMatch = text.trim().match(/IMG_PLACEHOLDER_(\d+)/)
        if (placeholderMatch) {
          const placeholder = `__IMG_PLACEHOLDER_${placeholderMatch[1]}__`
          const imageData = this.context.imageDataCache.get(placeholder)
          if (imageData && imageData.isValid) {
            return {
              stack: [
                {
                  image: imageData.url,
                  alignment: imageData.alignment || 'center',
                  width: imageData.width || 400,
                  height: imageData.height || 300,
                  margin: [0, 0, 0, 10]
                },
                {
                  text: imageData.alt || `Imagen ${placeholderMatch[1] + 1}`,
                  fontSize: 12,
                  alignment: imageData.alignment || 'center',
                  margin: [0, 5, 0, 15],
                  color: '#666'
                }
              ],
              margin: [0, 5, 0, 20],
              unbreakable: true
            }
          }
        }

        if (text.includes('IMG_PLACEHOLDER_')) {
          const placeholderRegex = /IMG_PLACEHOLDER_(\d+)/g
          let match
          const processedElements: any[] = []
          let lastIndex = 0

          while ((match = placeholderRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
              const beforeText = text.substring(lastIndex, match.index)
              if (beforeText.trim()) {
                processedElements.push({
                  text: beforeText,
                  fontSize: 12,
                  margin: [0, 2, 0, 2]
                })
              }
            }

            const placeholderNumber = match[1]
            const placeholder = `__IMG_PLACEHOLDER_${placeholderNumber}__`
            const imageData = this.context.imageDataCache.get(placeholder)
            if (imageData && imageData.isValid) {
              processedElements.push({
                stack: [
                  {
                    image: imageData.url,
                    alignment: imageData.alignment || 'center',
                    width: imageData.width || 400,
                    height: imageData.height || 300,
                    margin: [0, 0, 0, 10]
                  },
                  {
                    text: imageData.alt || `Imagen ${parseInt(placeholderNumber) + 1}`,
                    fontSize: 12,
                    alignment: imageData.alignment || 'center',
                    margin: [0, 5, 0, 15],
                    color: '#666'
                  }
                ],
                margin: [0, 5, 0, 20],
                unbreakable: true
              })
            } else {
              processedElements.push({
                text: `[Error: Image not found: ${match[0]}]`,
                color: 'red',
                fontSize: 10,
                margin: [0, 5, 0, 5]
              })
            }

            lastIndex = match.index + match[0].length
          }

          if (lastIndex < text.length) {
            const afterText = text.substring(lastIndex)
            if (afterText.trim()) {
              processedElements.push({
                text: afterText,
                fontSize: 12,
                margin: [0, 2, 0, 2]
              })
            }
          }

          if (processedElements.length > 0) {
            return processedElements
          }
        }

        return {
          text: text,
          fontSize: 12,
          margin: [0, 2, 0, 2]
        }
      }
      return null
    }

    if (!element.tagName) {
      return null
    }

    return this.processStructuredElement(element)
  }

  private tryParsePdfmakeObject(text: string): any {
    const trimmedText = text.trim()

    if (trimmedText.includes('__PDFMAKE_OBJECT_START__') && trimmedText.includes('__PDFMAKE_OBJECT_END__')) {
      try {
        const jsonMatch = trimmedText.match(/__PDFMAKE_OBJECT_START__(.+?)__PDFMAKE_OBJECT_END__/)
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1])
          if (parsed && (parsed.image || parsed.stack || parsed.table || parsed.text)) {
            return parsed
          }
        }
      } catch (error) {
        console.error(`[Content Pipeline] ❌ Error parsing PDFmake object from marker:`, error)
      }
    }

    if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmedText)
        if (parsed && (parsed.image || parsed.stack || parsed.table || parsed.text)) {
          return parsed
        }
      } catch (error) {
        // Not valid JSON
      }
    }

    return null
  }

  private processStructuredElement(element: any): any {
    const tagName = element.tagName?.toLowerCase()

    switch (tagName) {
      case 'h1':
        return {
          text: element.text || '',
          fontSize: 20,
          bold: true,
          margin: [0, 10, 0, 10]
        }

      case 'h2':
        return {
          text: element.text || '',
          fontSize: 18,
          bold: true,
          margin: [0, 10, 0, 10]
        }

      case 'h3':
        return {
          text: element.text || '',
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 10]
        }

      case 'p':
        const paragraphText = element.text || ''
        if (paragraphText.includes('IMG_PLACEHOLDER_')) {
          const placeholderRegex = /IMG_PLACEHOLDER_(\d+)/g
          let match
          const processedElements: any[] = []
          let lastIndex = 0

          while ((match = placeholderRegex.exec(paragraphText)) !== null) {
            if (match.index > lastIndex) {
              const beforeText = paragraphText.substring(lastIndex, match.index)
              if (beforeText.trim()) {
                processedElements.push({
                  text: beforeText,
                  fontSize: 12,
                  margin: [0, 5, 0, 5]
                })
              }
            }

            const placeholderNumber = match[1]
            const placeholder = `__IMG_PLACEHOLDER_${placeholderNumber}__`
            const imageData = this.context.imageDataCache.get(placeholder)
            if (imageData && imageData.isValid) {
              processedElements.push({
                stack: [
                  {
                    image: imageData.url,
                    alignment: imageData.alignment || 'center',
                    width: imageData.width || 400,
                    height: imageData.height || 300,
                    margin: [0, 0, 0, 10]
                  },
                  {
                    text: imageData.alt || `Imagen ${parseInt(placeholderNumber) + 1}`,
                    fontSize: 12,
                    alignment: imageData.alignment || 'center',
                    margin: [0, 5, 0, 15],
                    color: '#666'
                  }
                ],
                margin: [0, 5, 0, 20],
                unbreakable: true
              })
            } else {
              processedElements.push({
                text: `[Error: Image not found: ${match[0]}]`,
                color: 'red',
                fontSize: 10,
                margin: [0, 5, 0, 5]
              })
            }

            lastIndex = match.index + match[0].length
          }

          if (lastIndex < paragraphText.length) {
            const afterText = paragraphText.substring(lastIndex)
            if (afterText.trim()) {
              processedElements.push({
                text: afterText,
                fontSize: 12,
                margin: [0, 5, 0, 5]
              })
            }
          }

          if (processedElements.length > 0) {
            return processedElements
          }
        }

        return {
          text: paragraphText,
          fontSize: 12,
          margin: [0, 5, 0, 5]
        }

      case 'ul':
      case 'ol':
        return this.processListElement(element)

      case 'table':
        return this.tablePipeline.generateTablePdfObject(element)

      case 'div':
        return this.processDivElement(element)

      case 'img':
        return this.processDirectImageElement(element)

      case 'pdfmake-object':
        return this.processPdfmakeObjectElement(element)

      case 'hr':
        return {
          canvas: [
            { type: 'line', x1: 0, y1: 5, x2: 510, y2: 5, lineWidth: 1 }
          ],
          margin: [0, 10, 0, 10]
        }

      default:
        if (element.text && element.text.trim()) {
          return {
            text: element.text,
            fontSize: 12,
            margin: [0, 5, 0, 5]
          }
        }
    }
  }

  private processPdfmakeObjectElement(element: any): any {
    try {
      const dataAttribute = element.getAttribute?.('data')
      if (!dataAttribute) {
        console.error(`[❌ IMAGES] pdfmake-object element missing data attribute`)
        return null
      }

      const jsonContent = decodeURIComponent(dataAttribute)
      const pdfmakeObject = JSON.parse(jsonContent)

      return pdfmakeObject
    } catch (error: any) {
      console.error(`[❌ IMAGES] Error processing image object:`, error)
      return {
        text: `[Error processing image: ${error.message}]`,
        fontSize: 10,
        margin: [0, 10, 0, 10],
        color: 'red'
      }
    }
  }

  private processListElement(element: any): any {
    const items: any[] = []
    const listItems = element.querySelectorAll('li')
    listItems.forEach((li: any) => {
      items.push({
        text: li.text || '',
        fontSize: 12
      })
    })
    return {
      [element.tagName.toLowerCase()]: items,
      margin: [0, 5, 0, 5]
    }
  }

  private processDivElement(element: any): any {
    if (element.classList?.contains('pagebreak')) {
      return {
        text: '',
        pageBreak: 'after'
      }
    }

    if (element.text && element.text.trim()) {
      return {
        text: element.text,
        fontSize: 12,
        margin: [0, 5, 0, 5]
      }
    }
  }

  private processDirectImageElement(element: any): any {
    const imageUrl = element.getAttribute('src')
    const width = parseInt(element.getAttribute('width')) || 400
    const height = parseInt(element.getAttribute('height')) || 300

    const validation = (this.imagePipeline as any).validateImageForPdfmake(imageUrl)
    if (validation.isValid) {
      return {
        image: validation.url,
        alignment: 'center',
        width: width,
        height: height,
        margin: [0, 10, 0, 10]
      }
    }

    return {
      text: `[Imagen no válida: ${validation.error}]`,
      alignment: 'center',
      fontSize: 10,
      margin: [0, 10, 0, 10],
      color: 'red'
    }
  }

  private generateStyles(): any {
    return {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 15,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: 'black'
      }
    }
  }
}

// =======================================================================
// PDF GENERATION ORCHESTRATOR
// =======================================================================

export class PdfGenerationOrchestrator {
  private context: PdfGenerationContext
  private imagePipeline: ImageProcessingPipeline
  private tablePipeline: TableProcessingPipeline
  private contentPipeline: HtmlContentPipeline

  constructor() {
    this.context = {
      imageDataCache: new Map(),
      processingStats: {
        imagesProcessed: 0,
        tablesProcessed: 0,
        errors: []
      }
    }

    this.imagePipeline = new ImageProcessingPipeline(this.context)
    this.tablePipeline = new TableProcessingPipeline(this.context)
    this.contentPipeline = new HtmlContentPipeline(this.context, this.imagePipeline, this.tablePipeline)
  }

  async orchestratePdfGeneration(templateData: any, renderedContent: string, planTitle: string): Promise<TDocumentDefinitions> {
    try {
      void(`[🖼️ IMAGES] Starting PDF generation orchestration`)

      const { imagePlaceholders } = await this.imagePipeline.processImagesFromTemplate(templateData)

      let processedContent = renderedContent

      if (imagePlaceholders.length > 0) {
        const imageSection = `

## Detalles Gráficos

${imagePlaceholders.join('\n\n')}

`
        processedContent = processedContent + imageSection
      }

      const { processedHtml } = this.tablePipeline.processTables(processedContent)

      let htmlContent = await marked(processedHtml)
      htmlContent = await convertImagesToBase64(htmlContent)

      const documentDefinition = this.contentPipeline.parseHtmlToPdfContent(htmlContent, planTitle)

      // Add QR codes to first page
      if (templateData.hasQRCode && templateData.qrCode && templateData.qrCode.qrCodeImage) {
        const planQrStack = {
          stack: [
            {
              image: templateData.qrCode.qrCodeImage,
              width: 80,
              height: 80,
              alignment: 'right',
              margin: [0, 10, 5, 0]
            },
            {
              text: 'Escanear para acceder al plan',
              fontSize: 10,
              alignment: 'right',
              color: '#666',
              margin: [0, 0, 15, 0]
            }
          ],
          margin: [0, 0, 20, 0],
          unbreakable: true
        }

        if (documentDefinition.content && documentDefinition.content.length > 0) {
          documentDefinition.content.unshift(planQrStack)
        } else {
          documentDefinition.content = [planQrStack]
        }
      }

      if (templateData.hasIssueQRCode && templateData.issueQrCode && templateData.issueQrCode.qrCodeImage) {
        const issueQrStack = {
          stack: [
            {
              image: templateData.issueQrCode.qrCodeImage,
              width: 80,
              height: 80,
              alignment: 'right',
              margin: [0, 110, 5, 0]
            },
            {
              text: 'Escanear para reportar incidencias',
              fontSize: 10,
              alignment: 'right',
              color: '#666',
              margin: [0, 0, 15, 0]
            }
          ],
          margin: [0, 0, 20, 0],
          unbreakable: true
        }

        if (documentDefinition.content && documentDefinition.content.length > 0) {
          documentDefinition.content.unshift(issueQrStack)
        } else {
          documentDefinition.content = [issueQrStack]
        }
      }

      return documentDefinition
    } catch (error: any) {
      console.error('[❌ ERROR] Orchestration failed:', error)
      this.context.processingStats.errors.push(`Orchestration error: ${error.message}`)

      return {
        content: [
          { text: planTitle, fontSize: 24, bold: true, margin: [0, 0, 0, 20] },
          { text: `Error en la generación del PDF: ${error.message}`, fontSize: 12, margin: [0, 10, 0, 10] }
        ],
        styles: {},
        defaultStyle: {
          font: 'Roboto',
          columnGap: 20
        },
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60]
      } as TDocumentDefinitions
    }
  }

  getProcessingStats() {
    return { ...this.context.processingStats }
  }
}

// =======================================================================
// HELPER FUNCTIONS
// =======================================================================

export async function processImagesForPdfmake(images: any[]): Promise<any[]> {
  const pdfmakeImages = []

  for (let i = 0; i < images.length; i++) {
    const img = images[i]

    try {
      if (!img || img.url === undefined || img.url === null || img.url === '') {
        continue
      }

      let base64Url = img.url

      if (!img.url.startsWith('data:')) {
        try {
          base64Url = await imageUrlToBase64(img.url)
        } catch (conversionError) {
          continue
        }
      }

      const validation = validateImageForPdfmake(base64Url)
      if (validation.isValid) {
        pdfmakeImages.push({
          name: img.name || `Imagen ${i + 1}`,
          description: img.description || img.desc || '',
          pdfmakeObject: {
            image: validation.url,
            width: 400,
            height: 300,
            alignment: 'center',
            margin: [0, 10, 0, 10]
          },
          index: i
        })
      }
    } catch (error) {
      console.error(`[PDFmake Images] ❌ Error processing image ${i}:`, error)
    }
  }

  return pdfmakeImages
}

function validateImageForPdfmake(imageUrl: string | undefined | null): { url: string, isValid: boolean, error?: string } {
  if (imageUrl === undefined || imageUrl === null || imageUrl === '') {
    return { url: imageUrl || '', isValid: false, error: 'Empty image URL' }
  }

  if (imageUrl.startsWith('data:')) {
    const cleanImageUrl = imageUrl.replace(/\s+/g, '').trim()
    const dataUrlMatch = cleanImageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/)

    if (!dataUrlMatch) {
      return { url: cleanImageUrl, isValid: false, error: 'Invalid base64 format' }
    }

    const [, mimeType, base64Data] = dataUrlMatch
    const base64Length = base64Data.length
    const maxBase64Length = 500 * 1024

    if (base64Length > maxBase64Length) {
      return { url: cleanImageUrl, isValid: false, error: 'Image too large' }
    }

    if (base64Length < 50) {
      return { url: cleanImageUrl, isValid: false, error: 'Base64 data too short' }
    }

    return { url: cleanImageUrl, isValid: true }
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return { url: imageUrl, isValid: true }
  }

  return { url: imageUrl, isValid: false, error: 'Unsupported URL format' }
}

export async function prepareTemplateData(plan: any, Planes: any, Concepto: any): Promise<any> {
  const templateData: any = {
    _id: plan._id?.toString() || plan.id?.toString() || '',
    nom_obra: plan.nom_obra || 'Nombre no especificado',
    dir_obra: plan.dir_obra || 'Dirección no especificada',
    poblacion_obra: plan.poblacion_obra || 'Población no especificada',
    cp_obra: plan.cp_obra || 'CP no especificado',
    desc_obra: plan.desc_obra || 'Descripción no especificada',
    desc_condiciones_obra: plan.desc_condiciones_obra || 'Condiciones no especificadas',
    duracion_meses: plan.duracion_meses || 0,
    superficie_construida_obra: plan.superficie_construida_obra || 0,
    perimetro_obra: plan.perimetro_obra || 0,
    num_plantas_sobre: plan.num_plantas_sobre || 0,
    num_plantas_bajo: plan.num_plantas_bajo || 0,
    num_trab_plan: plan.num_trab_plan || 0,

    nom_plandeseguridad: plan.nom_plandeseguridad || 'Plan no especificado',
    desc_plandeseguridad: plan.desc_plandeseguridad || 'Descripción no especificada',
    hay_planos: plan.hay_planos || 'No especificado',
    entorno_obra: plan.entorno_obra || 'No especificado',
    condiciones_entorno_obra: plan.condiciones_entorno_obra || 'No especificadas',
    lineas_aereas: plan.lineas_aereas || 'No especificadas',
    conducciones_enterradas: plan.conducciones_enterradas || 'No especificadas',
    estado_medianeras: plan.estado_medianeras || 'No especificado',
    acometidas: plan.acometidas || 'No especificadas',
    interferencias_edificios: plan.interferencias_edificios || 'No especificadas',
    servidumbres_de_paso: plan.servidumbres_de_paso || 'No especificadas',
    trafico: plan.trafico || 'No especificado',
    instalacion_electrica: plan.instalacion_electrica || 'No especificada',
    instalacion_agua: plan.instalacion_agua || 'No especificada',
    centro_asistencial: plan.centro_asistencial || 'No especificado',
    centro_asistencial_primaria: plan.centro_asistencial_primaria || 'No especificada',
    num_extintoresco2: plan.num_extintoresco2 || 0,
    num_extintoresabc: plan.num_extintoresabc || 0,
    num_duchas: plan.num_duchas || 0,
    num_lavabos: plan.num_lavabos || 0,
    num_comedores: plan.num_comedores || 0,
    num_vestuarios: plan.num_vestuarios || 0,
    contenido_botiquin: plan.contenido_botiquin || 'No especificado',
    orografia: plan.orografia || 'No especificada',
    condiciones_clima: plan.condiciones_clima || 'No especificadas',

    presupuesto_total_obra: plan.presupuesto_total_obra || 0,
    presupuesto_total_seguridad: plan.presupuesto_total_seguridad || 0,
    presupuesto_objeto_obra: plan.presupuesto_objeto_obra || 0,
    presupuesto_objeto_seguridad: plan.presupuesto_objeto_seguridad || 0,

    clima: plan.clima || 'No especificado',
    clima_obj: typeof plan.clima === 'object' ? plan.clima : { descripcion: plan.clima || 'No especificado' },

    nom_promotor: plan.promotor?.nom_promotor || 'Promotor no especificado',
    cif_promotor: plan.promotor?.cif_promotor || 'CIF no especificado',
    dir_promotor: plan.promotor?.dir_promotor || 'Dirección no especificada',
    localidad_promotor: plan.promotor?.localidad_promotor || plan.poblacion_obra || 'Localidad no especificada',
    cp_promotor: plan.promotor?.cp_promotor || plan.cp_obra || 'CP no especificado',
    telf_promotor: plan.promotor?.telf_promotor || 'Teléfono no especificado',
    email_promotor: plan.promotor?.email_promotor || 'Email no especificado',

    promotor: {
      nom_promotor: plan.promotor?.nom_promotor || 'Promotor no especificado',
      cif_promotor: plan.promotor?.cif_promotor || 'CIF no especificado',
      dir_promotor: plan.promotor?.dir_promotor || 'Dirección no especificada',
      localidad_promotor: plan.promotor?.localidad_promotor || plan.poblacion_obra || 'Localidad no especificada',
      cp_promotor: plan.promotor?.cp_promotor || plan.cp_obra || 'CP no especificado',
      telf_promotor: plan.promotor?.telf_promotor || 'Teléfono no especificado',
      email_promotor: plan.promotor?.email_promotor || 'Email no especificado'
    },

    contratista: {
      nom_contratista: plan.contratista?.nom_contratista || 'Contratista no especificado',
      cif_contratista: plan.contratista?.cif_contratista || 'CIF no especificado',
      dir_contratista: plan.contratista?.dir_contratista || 'Dirección no especificada',
      localidad_contratista: plan.contratista?.localidad_contratista || 'Localidad no especificada',
      cp_contratista: plan.contratista?.cp_contratista || 'CP no especificado',
      telf_contratista: plan.contratista?.telf_contratista || 'Teléfono no especificado',
      email_contratista: plan.contratista?.email_contratista || 'Email no especificado',
      pob_contratista: plan.contratista?.localidad_contratista || 'Población no especificada',
      poblacion_contratista: plan.contratista?.localidad_contratista || 'Población no especificada',
      nom_recurso_preventivo: plan.contratista?.nom_recurso_preventivo || 'Recurso no especificado',
      dni_recurso_preventivo: plan.contratista?.dni_recurso_preventivo || 'DNI no especificado',
      telf_recurso_preventivo: plan.contratista?.telf_recurso_preventivo || 'Teléfono no especificado'
    },

    nom_recurso_preventivo: plan.contratista?.nom_recurso_preventivo || 'Recurso no especificado',
    dni_recurso_preventivo: plan.contratista?.dni_recurso_preventivo || 'DNI no especificado',
    telf_recurso_preventivo: plan.contratista?.telf_recurso_preventivo || 'Teléfono no especificado',

    createdAt: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES'),
    updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES'),

    presupuesto: (plan.presupuesto || []).map((item: any) => ({
      ...item,
      // Normalizar nombres de campos para compatibilidad con templates
      nom_concepto: item.concepto || item.nom_concepto || item.nombre || 'Sin concepto',
      precio_concepto: item.precioud || item.precio || item.precio_concepto || 0,
      tipo_concepto_unidad: item.ud || item.unidad || 'ud'
    })),
    userPresupuesto: plan.userPresupuesto || [],

    presupuesto_by_tipo: (() => {
      const grouped: Record<string, any[]> = {}
      const allItems = plan.presupuesto || []

      allItems.forEach((item: any) => {
        const tipo = item.tipo || item.categoria || 'General'
        if (!grouped[tipo]) {
          grouped[tipo] = []
        }
        grouped[tipo].push({
          ...item,
          ud: item.ud || item.unidad || 'ud',
          concepto: item.concepto || item.nom_concepto || item.nombre || 'Sin concepto',
          precioud: item.precioud || item.precio || item.precio_concepto || 0,
          amortizacion: item.amortizacion || item.porcentaje_amortizacion || '0%',
          total: item.total || (item.ud || item.cantidad || 1) * (item.precioud || item.precio || item.precio_concepto || 0)
        })
      })

      return Object.entries(grouped).map(([tipo, items]) => {
        const suma_parcial = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
        return {
          tipo,
          items,
          suma_parcial: suma_parcial.toFixed(2)
        }
      })
    })(),

    suma_total: (() => {
      const allItems = plan.presupuesto || []
      const total = allItems.reduce((sum: number, item: any) => {
        const itemTotal = item.total || (item.ud || item.cantidad || 1) * (item.precioud || item.precio || item.precio_concepto || 0)
        return sum + itemTotal
      }, 0)
      return total.toFixed(2)
    })(),

    nom_contratista: plan.contratista?.nom_contratista || 'Contratista no especificado',
    userCapitulos: plan.userCapitulos || [],
    userPartidas: plan.userPartidas || [],
    tec_obra: plan.tec_obra || [],
    personal_obra: plan.personal_obra || [],
    seguros_contratista: plan.seguros_contratista || [],
    subcontratistas: plan.subcontratistas || [],
    det_graf: plan.det_graf || [],
    desc_cap_obra: plan.desc_cap_obra || [],

    detalles_graficos: (plan.det_graf || [])
      .map((img: any) => `![${img.name || 'Imagen'}](${img.url || ''})`)
      .join('\n\n'),

    detalles_graficos_count: (plan.det_graf || []).length,

    qrCode: plan.qrCode && plan.qrEnabled !== false
      ? {
          qrCodeImage: plan.qrCode.qrCodeImage,
          slug: plan.qrCode.slug,
          publicUrl: plan.qrCode.publicUrl || `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/public/planes/${plan._id}/${plan.qrCode.slug}`,
          expiresAt: plan.qrCode.expiresAt,
          enabled: plan.qrCode.enabled !== false
        }
      : null,
    hasQRCode: !!(plan.qrCode && plan.qrEnabled !== false && plan.qrCode.enabled !== false && plan.qrCode.qrCodeImage && typeof plan.qrCode.qrCodeImage === 'string' && plan.qrCode.qrCodeImage.length > 0),

    issueQrCode: plan.issueQrCode && plan.issueQrEnabled !== false
      ? {
          qrCodeImage: plan.issueQrCode.qrCodeImage,
          slug: plan.issueQrCode.slug,
          accessToken: plan.issueQrCode.accessToken,
          publicUrl: `${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/public/issues/${plan.issueQrCode.slug}/${plan.issueQrCode.accessToken}`,
          expiresAt: plan.issueQrCode.expiresAt,
          enabled: plan.issueQrCode.enabled !== false
        }
      : null,
    hasIssueQRCode: !!(plan.issueQrCode && plan.issueQrEnabled !== false && plan.issueQrCode.enabled !== false && plan.issueQrCode.qrCodeImage && typeof plan.issueQrCode.qrCodeImage === 'string' && plan.issueQrCode.qrCodeImage.length > 0),

    _debugIssueQR: {
      hasIssueQrCode: !!plan.issueQrCode,
      issueQrEnabled: plan.issueQrEnabled,
      hasQrCodeImage: !!plan.issueQrCode?.qrCodeImage,
      qrCodeImageType: typeof plan.issueQrCode?.qrCodeImage,
      qrCodeImageLength: plan.issueQrCode?.qrCodeImage?.length || 0,
      enabled: plan.issueQrCode?.enabled
    },

    hasPresupuesto: (plan.presupuesto && plan.presupuesto.length > 0) || false,
    hasTecnicos: (plan.tec_obra && plan.tec_obra.length > 0) || false,
    hasSubcontratistas: (plan.subcontratistas && plan.subcontratistas.length > 0) || false,
    hasPersonal: (plan.personal_obra && plan.personal_obra.length > 0) || false
  }

  // Process partidas with conceptos
  const partidasWithData: any[] = []
  if (plan.userPartidas && plan.userPartidas.length > 0) {
    const activePartidas = plan.userPartidas.filter((partida: any) =>
      partida.active === true || partida.active === undefined || partida.active === null
    )

    for (const userPartida of activePartidas) {
      try {
        const concepto = await Concepto.findOne({
          $or: [
            { nom_concepto: userPartida.nom_concepto },
            { nombre: userPartida.nom_concepto }
          ]
        }).lean()

        if (concepto) {
          partidasWithData.push({
            ...userPartida,
            ...concepto,
            evaluaciones: concepto.evaluaciones || [],
            desc_concepto: concepto.desc_concepto || 'Sin descripción',
            epis: concepto.epis || [],
            pcols: concepto.pcols || [],
            maqs: concepto.maqs || [],
            medauxs: concepto.medauxs || [],
            pqs: concepto.pqs || []
          })
        } else {
          partidasWithData.push({
            ...userPartida,
            evaluaciones: [],
            desc_concepto: 'Sin descripción',
            epis: [],
            pcols: [],
            maqs: [],
            medauxs: [],
            pqs: []
          })
        }
      } catch (error) {
        console.error(`Error fetching concepto for ${userPartida.nom_concepto}:`, error)
        partidasWithData.push({
          ...userPartida,
          evaluaciones: [],
          desc_concepto: 'Sin descripción',
          epis: [],
          pcols: [],
          maqs: [],
          medauxs: [],
          pqs: []
        })
      }
    }
  }

  templateData.userPartidas = partidasWithData

  // Add chapters structure
  const { useDb } = await import('./db')
  const { MasterTableType } = await import('../models/MasterTable')
  templateData.chapters = await createChaptersStructure(partidasWithData, useDb, MasterTableType)
  templateData.partidasnombre = partidasWithData.map((p, index) => `${index + 1}. ${p.nom_concepto || p.nombre || 'Sin nombre'}`)
  templateData.partidasprecio = partidasWithData.map(p => p.precio_concepto || p.precio || 0)
  templateData.partidasunidad = partidasWithData.map(p => p.tipo_concepto_unidad || p.unidad || 'unidad')
  templateData.partidasdescripcion = partidasWithData.map(p => p.descripcion || p.desc_concepto || 'Sin descripción')

  return templateData
}

async function createChaptersStructure(
  partidasWithData: any[],
  useDb: () => Promise<any>,
  MasterTableType: any
): Promise<any[]> {
  try {
    const db = await useDb()
    const MasterTableModel = db.MasterTable('mastertable')

    const allCapitulos = await MasterTableModel.find({
      type: MasterTableType.CAPITULO
    })
      .sort({ order: 1 })
      .lean()

    const categoryGroups: Record<number, any[]> = {}

    allCapitulos.forEach((capitulo: any) => {
      const capituloOrder = capitulo.order
      if (capituloOrder && typeof capituloOrder === 'number') {
        categoryGroups[capituloOrder] = []
      }
    })

    partidasWithData.forEach((partida) => {
      const capituloOrder = partida.capitulo || 1
      const targetOrder = categoryGroups[capituloOrder] !== undefined ? capituloOrder : 1

      if (!categoryGroups[targetOrder]) {
        categoryGroups[targetOrder] = []
      }
      categoryGroups[targetOrder].push(partida)
    })

    const chapters: any[] = []
    let chapterIndex = 1
    const startSectionNumber = 4

    allCapitulos.forEach((capitulo: any) => {
      const capituloOrder = capitulo.order
      if (capituloOrder && typeof capituloOrder === 'number') {
        const items = categoryGroups[capituloOrder]
        if (items && items.length > 0) {
          const chapterDisplayNumber = `${startSectionNumber}.${chapterIndex}`
          const chapterName = capitulo.description || capitulo.name

          chapters.push({
            id: chapterDisplayNumber,
            name: chapterName,
            displayNumber: chapterDisplayNumber,
            displayName: `${chapterDisplayNumber}. ${chapterName}`,
            originalOrder: capitulo.order,
            items: items.map((partida: any, itemIndex: number) => ({
              _id: partida._id?.toString() || partida.id?.toString() || '',
              ...partida,
              nom_concepto: partida.nom_concepto || partida.nombre || 'Sin nombre',
              desc_concepto: partida.desc_concepto || partida.descripcion || 'Sin descripción',
              evaluaciones: partida.evaluaciones || [],
              epis: Array.isArray(partida.epis) && partida.epis.length > 0
                ? partida.epis.join(', ')
                : (partida.epis || 'No hay EPIs definidos para esta partida'),
              pcols: Array.isArray(partida.pcols) && partida.pcols.length > 0
                ? partida.pcols.join(', ')
                : 'No hay protecciones colectivas definidas para esta partida',
              maqs: Array.isArray(partida.maqs) && partida.maqs.length > 0
                ? partida.maqs.join(', ')
                : 'No hay maquinarias definidas para esta partida',
              medauxs: Array.isArray(partida.medauxs) && partida.medauxs.length > 0
                ? partida.medauxs.join(', ')
                : 'No hay medios auxiliares definidos para esta partida',
              pqs: Array.isArray(partida.pqs) && partida.pqs.length > 0
                ? partida.pqs.join(', ')
                : 'No hay productos químicos definidos para esta partida',
              chapter_display_number: chapterDisplayNumber,
              item_index: itemIndex + 1,
              full_number: `${chapterDisplayNumber}.${itemIndex + 1}`
            }))
          })
          chapterIndex++
        }
      }
    })

    return chapters
  } catch (error) {
    console.error('[PDF Generation] Error creating chapters structure:', error)
    return []
  }
}

// =======================================================================
// MAIN PDF GENERATION FUNCTION
// =======================================================================

export async function generatePlanPDF(
  plan: any,
  templateContent: string,
  templateValue: string,
  Planes: any,
  Concepto: any
): Promise<Buffer> {
  void(`[PDF Generation] Starting PDF generation for plan: ${plan.nom_obra}`)

  // Prepare template data
  const templateData = await prepareTemplateData(plan, Planes, Concepto)

  // Validate template data
  const validation = validateTemplateData(templateContent, templateData)
  void(`[PDF Generation] Template validation result:`, validation)

  // Pre-process template images
  void(`[PDF Generation] Pre-processing template images...`)
  let processedTemplateContent
  try {
    processedTemplateContent = await preprocessTemplateImages(templateContent, templateData)
    void(`[PDF Generation] Image preprocessing completed`)
  } catch (preprocessError: any) {
    console.warn(`[PDF Generation] Image preprocessing failed, using original template:`, preprocessError.message)
    processedTemplateContent = templateContent
  }

  // Render template with Handlebars
  let renderedContent = ''
  try {
    void(`[PDF Generation] Rendering template...`)
    renderedContent = renderTemplate(processedTemplateContent, templateData)

    if (renderedContent.startsWith('Error:')) {
      console.error(`[PDF Generation] Main renderer returned error:`, renderedContent)

      const simpleRendered = renderTemplateSimple(processedTemplateContent, templateData)
      if (!simpleRendered.startsWith('Error:')) {
        renderedContent = simpleRendered
      } else {
        const minimalRendered = renderTemplateMinimal(processedTemplateContent, templateData)
        if (!minimalRendered.startsWith('Error:')) {
          renderedContent = minimalRendered
        } else {
          throw new Error(`All renderers failed: ${minimalRendered}`)
        }
      }
    }

    void(`[PDF Generation] Template rendering completed successfully`)
  } catch (renderError: any) {
    console.error('[PDF Generation] Error rendering template:', renderError)
    throw new Error(`Template rendering failed: ${renderError.message}`)
  }

  // Replace pagebreak comments
  const contentWithPageBreaks = renderedContent.replace(/<!-- pagebreak -->/gi, '<div class="pagebreak"></div>')

  // Use orchestration system
  void(`[PDF Generation] Using orchestration system...`)
  const orchestrator = new PdfGenerationOrchestrator()
  const documentDefinition = await orchestrator.orchestratePdfGeneration(
    templateData,
    contentWithPageBreaks,
    plan.nom_obra || 'Plan de Seguridad'
  )

  const stats = orchestrator.getProcessingStats()
  void(`[PDF Generation] Final processing stats:`, stats)

  // Generate PDF
  void(`[PDF Generation] Creating PDF with document definition...`)
  const pdfBuffer = await generatePdfLazy(documentDefinition)
  void(`[PDF Generation] PDF buffer created successfully, size: ${pdfBuffer.length} bytes`)

  return pdfBuffer
}
