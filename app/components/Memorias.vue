<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import * as Handlebars from 'handlebars'
import MarkdownIt from 'markdown-it'
import { useTemplatesStore } from '@/stores/templates'
import { useUserStore } from '@/stores/user'
import { useOverlay } from '#imports'
import { UModal } from '#components'
import ModalTemplateCreate from '@/components/ModalTemplateCreate.vue'
import DetallesGraficosComponent from '@/components/DetallesGraficosComponent.vue'
// Import PDF libraries dynamically on client side only
const jsPDF = () => import('jspdf')
const html2canvas = () => import('html2canvas')

const emit = defineEmits<{
  (e: 'create-template'): void
  (e: 'edit-template', template: SavedTemplate): void
}>()

interface TemplateVariable {
  [key: string]: string
}

interface SavedTemplate {
  _id?: string
  id?: string | number
  name: string
  description?: string
  content: string
  category?: string
  isDefault?: boolean
  isGlobal?: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

interface TemplateFormData {
  name: string
  description: string
  content: string
  category: string
  isDefault: boolean
}

// Store instances
const templatesStore = useTemplatesStore()
const userStore = useUserStore()

// Reactive state
const markdownContent = ref(`# Memoria de Proyecto

## Información General
- **Proyecto:** {{nombreProyecto}}
- **Cliente:** {{nombreCliente}}
- **Fecha:** {{fecha}}
- **Responsable:** {{responsable}}

## Descripción del Proyecto
{{descripcionProyecto}}

## Materiales Utilizados
1. {{material1}}
2. {{material2}}
3. {{material3}}

## Especificaciones Técnicas
- **Longitud Total:** {{longitudTotal}} metros
- **Diámetro:** {{diametro}} mm
- **Presión de Trabajo:** {{presionTrabajo}} bar

## Observaciones
{{observaciones}}

---
*Documento generado automáticamente*`)

const selectedTemplate = ref<SavedTemplate | null>(null)
const isGeneratingPDF = ref(false)

// Template management state
const isLoading = ref(false)

// Computed property for saved templates from store
const savedTemplates = computed(() => {
  console.log('📚 Memorias - savedTemplates computed called')
  console.log('📚 Memorias - templatesStore.allTemplates:', templatesStore.allTemplates)
  console.log('📚 Memorias - templatesStore.allTemplates length:', templatesStore.allTemplates?.length)
  return templatesStore.allTemplates
})

const showVariableEditor = ref(false)

// Computed property to check if user can edit template
const canEditTemplate = computed(() => (template: SavedTemplate) => {
  return !template.isGlobal || userStore.user.role === 'admin'
})

// Template variables for substitution
const templateVariables = ref<TemplateVariable>({
  nombreProyecto: 'Proyecto de Ejemplo',
  nombreCliente: 'Cliente S.L.',
  fecha: new Date().toLocaleDateString('es-ES'),
  responsable: 'Ingeniero Responsable',
  descripcionProyecto: 'Descripción detallada del proyecto de instalación.',
  material1: 'Tubería PVC Ø32mm',
  material2: 'Codos 90° PVC',
  material3: 'Válvulas de corte',
  longitudTotal: '150',
  diametro: '32',
  presionTrabajo: '10',
  observaciones: 'Sin observaciones adicionales.'
})

// Markdown renderer instance
const md = new MarkdownIt()

// Computed properties
const processedContent = computed(() => {
  try {
    const template = Handlebars.compile(markdownContent.value)
    return template(templateVariables.value)
  } catch (error) {
    console.error('Error processing template:', error)
    return markdownContent.value
  }
})

const availableVariables = computed(() => {
  const regex = /{{([^}]+)}}/g
  const matches: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(markdownContent.value)) !== null) {
    const variableName = match[1]?.trim()
    if (variableName && !matches.includes(variableName)) {
      matches.push(variableName)
    }
  }
  return matches
})

// Rendered content with variables replaced
const renderedContent = computed(() => {
  try {
    const template = Handlebars.compile(markdownContent.value)
    const compiledMarkdown = template(templateVariables.value)
    return MarkdownIt().render(compiledMarkdown)
  } catch (error) {
    console.error('Error rendering content:', error)
    return MarkdownIt().render(markdownContent.value)
  }
})

// Extract S3 URLs for PDF generation
const getImageUrlsFromMarkdown = computed(() => {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const urls: Array<{ alt: string, url: string }> = []
  let match

  while ((match = imageRegex.exec(markdownContent.value)) !== null) {
    urls.push({
      alt: match[1] || '',
      url: match[2] || ''
    })
  }

  return urls
})

// Overlay for modal management
const overlay = useOverlay()
const toast = useToast()

// Methods
const loadTemplate = (template: SavedTemplate) => {
  console.log('📥 Memorias - loadTemplate called with:', template)
  console.log('📥 Memorias - template.name:', template.name)
  console.log('📥 Memorias - template._id:', template._id)
  markdownContent.value = template.content
  selectedTemplate.value = template
  console.log('📥 Memorias - Template loaded successfully')
}

// Image insertion methods
const insertImage = (imageUrl: string, altText: string = 'Imagen') => {
  const imageMarkdown = `![${altText}](${imageUrl})`
  markdownContent.value += `\n\n${imageMarkdown}\n\n`
}

const insertImageAtCursor = (imageUrl: string, altText: string = 'Imagen') => {
  const imageMarkdown = `![${altText}](${imageUrl})`
  const editor = document.querySelector('.md-editor')
  if (editor) {
    // This would require more complex handling for cursor position
    insertImage(imageUrl, altText)
  } else {
    insertImage(imageUrl, altText)
  }
}

// Template variables for modal (array format for ModalTemplateCreate)
const modalTemplateVariables = [
  { key: 'nombreProyecto', label: 'Nombre del Proyecto', value: '', description: 'Nombre del proyecto' },
  { key: 'nombreCliente', label: 'Nombre del Cliente', value: '', description: 'Nombre del cliente' },
  { key: 'fecha', label: 'Fecha', value: '', description: 'Fecha del proyecto' },
  { key: 'responsable', label: 'Responsable', value: '', description: 'Responsable del proyecto' },
  { key: 'descripcionProyecto', label: 'Descripción del Proyecto', value: '', description: 'Descripción detallada' },
  { key: 'material1', label: 'Material 1', value: '', description: 'Primer material' },
  { key: 'material2', label: 'Material 2', value: '', description: 'Segundo material' },
  { key: 'material3', label: 'Material 3', value: '', description: 'Tercer material' },
  { key: 'longitudTotal', label: 'Longitud Total', value: '', description: 'Longitud total del proyecto' },
  { key: 'diametro', label: 'Diámetro', value: '', description: 'Diámetro de tuberías' },
  { key: 'presionTrabajo', label: 'Presión de Trabajo', value: '', description: 'Presión de trabajo' },
  { key: 'observaciones', label: 'Observaciones', value: '', description: 'Observaciones adicionales' }
]

// Template save handler
const handleTemplateSave = async (templateData: any, templateId?: string) => {
  console.log('💾 Memorias - handleTemplateSave called with:', templateData, 'ID:', templateId)

  try {
    if (templateId) {
      // Update existing template
      await templatesStore.updateTemplate(templateId, templateData)
    } else {
      // Create new template
      await templatesStore.createTemplate(templateData)
    }

    // Reload templates to refresh the UI
    await templatesStore.loadTemplates(userStore.user._id)

    console.log('💾 Memorias - Template saved successfully')
  } catch (error: any) {
    console.error('💾 Memorias - Error saving template:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Error al guardar la plantilla',
      color: 'error'
    })
    throw error
  }
}

// Template CRUD operations using overlay pattern (matching settings.vue)
const openCreateTemplate = async () => {
  console.log('🆕 Memorias - openCreateTemplate called')

  const modal = overlay.create(ModalTemplateCreate, {
    props: {
      title: 'Crear Nueva Plantilla de Memoria',
      availableVariables: modalTemplateVariables,
      defaultContent: `# Memoria de Proyecto

## Información General
- **Proyecto:** {{nombreProyecto}}
- **Cliente:** {{nombreCliente}}
- **Fecha:** {{fecha}}
- **Responsable:** {{responsable}}

## Descripción del Proyecto
{{descripcionProyecto}}

## Materiales
- {{material1}}
- {{material2}}
- {{material3}}

## Especificaciones Técnicas
- **Longitud Total:** {{longitudTotal}}
- **Diámetro:** {{diametro}}
- **Presión de Trabajo:** {{presionTrabajo}}

## Observaciones
{{observaciones}}`,
      showSave: true,
      showVariables: true,
      onClose: async (result: any) => {
        console.log('🆕 Memorias - Template modal closed with result:', result)
        if (result && typeof result === 'object' && result.name) {
          await handleTemplateSave(result)
        }
      }
    }
  })

  try {
    console.log('🆕 Memorias - About to open modal...')
    modal.open()
    console.log('🆕 Memorias - Modal opened successfully')
  } catch (error) {
    console.error('🆕 Memorias - Error with create template modal:', error)
  }
}

const openEditTemplate = async (template: SavedTemplate) => {
  console.log('📝 Memorias - openEditTemplate called with template:', template)
  console.log('📝 Memorias - template._id:', template._id)
  console.log('📝 Memorias - template.name:', template.name)

  // Emit the event to parent component (settings.vue) to handle the modal
  emit('edit-template', template)
}

const confirmDeleteTemplate = (template: SavedTemplate) => {
  console.log('🗑️ Memorias - confirmDeleteTemplate called with:', template)
  console.log('🗑️ Memorias - template.name:', template.name)
  console.log('🗑️ Memorias - template._id:', template._id)

  // Use native confirm dialog for now to avoid Nuxt UI v3 migration complexity
  const confirmed = confirm(`¿Estás seguro de que quieres eliminar la plantilla "${template.name}"?\n\nEsta acción no se puede deshacer.`)

  if (confirmed) {
    deleteTemplate(template)
  }

  console.log('🗑️ Memorias - Delete confirmation dialog result:', confirmed)
}

const deleteTemplate = async (template: SavedTemplate) => {
  if (!template || !template._id) return

  isLoading.value = true

  try {
    await templatesStore.deleteTemplate(template._id)

    // Clear selection if deleted template was selected
    if (selectedTemplate.value?._id === template._id) {
      selectedTemplate.value = null
    }

    useToast().add({
      title: 'Éxito',
      description: 'Plantilla eliminada correctamente',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error deleting template:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'Error al eliminar la plantilla',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

const duplicateTemplate = async (template: SavedTemplate) => {
  console.log('📋 Memorias - duplicateTemplate called with:', template)
  console.log('📋 Memorias - template.name:', template.name)
  console.log('📋 Memorias - template._id:', template._id)

  try {
    const duplicatedTemplateData = {
      name: `${template.name} (Copia)`,
      description: template.description || '',
      value: `${(template as any).value}-copia-${Date.now()}`,
      content: template.content,
      category: (template as any).category || 'general',
      isDefault: false,
      isGlobal: false
    }

    console.log('📋 Memorias - duplicatedTemplateData:', duplicatedTemplateData)
    await templatesStore.createTemplate(duplicatedTemplateData)
    console.log('📋 Memorias - Template duplicated successfully')

    useToast().add({
      title: 'Éxito',
      description: 'Plantilla duplicada correctamente',
      color: 'success'
    })
  } catch (error: any) {
    console.error('📋 Memorias - Error duplicating template:', error)
    useToast().add({
      title: 'Error',
      description: error.message || 'Error al duplicar la plantilla',
      color: 'error'
    })
  }
}

// Handle template actions directly
const handleTemplateAction = (action: string, template: SavedTemplate) => {
  console.log('🎯 Memorias - handleTemplateAction called with:', action, 'for template:', template.name)

  if (!action || !template) {
    console.log('🎯 Memorias - No action or template, skipping')
    return
  }

  switch (action) {
    case 'cargar':
      console.log('🎯 Memorias - Executing CARGAR action for template:', template.name)
      loadTemplate(template)
      break
    case 'editar':
      console.log('🎯 Memorias - Executing EDITAR action for template:', template.name)
      openEditTemplate(template)
      break
    case 'duplicar':
      console.log('🎯 Memorias - Executing DUPLICAR action for template:', template.name)
      duplicateTemplate(template)
      break
    case 'eliminar':
      console.log('🎯 Memorias - Executing ELIMINAR action for template:', template.name)
      confirmDeleteTemplate(template)
      break
    default:
      console.warn('🎯 Memorias - Unknown action:', action)
  }
}

// Group templates by category
const templatesByCategory = computed(() => {
  console.log('📂 Memorias - templatesByCategory computed called')
  console.log('📂 Memorias - savedTemplates.value:', savedTemplates.value)
  console.log('📂 Memorias - savedTemplates.value length:', savedTemplates.value?.length)

  const grouped: Record<string, SavedTemplate[]> = {}

  savedTemplates.value.forEach((template, index) => {
    console.log(`📂 Memorias - Processing template ${index}:`, template)
    const category = (template as any).category || 'general'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(template)
  })

  console.log('📂 Memorias - Final grouped templates:', grouped)
  return grouped
})

const getCategoryLabel = (category: string) => {
  const templateCategories = [
    { value: 'general', label: 'General' },
    { value: 'tecnica', label: 'Técnica' },
    { value: 'seguridad', label: 'Seguridad' },
    { value: 'instalaciones', label: 'Instalaciones' },
    { value: 'personalizada', label: 'Personalizada' }
  ]
  const cat = templateCategories.find(c => c.value === category)
  return cat ? cat.label : category
}

const addVariable = () => {
  const varName = prompt('Nombre de la variable (sin {{}}):')?.trim()
  if (varName && !(varName in templateVariables.value)) {
    templateVariables.value[varName] = ''
  }
}

const removeVariable = (varName: string) => {
  delete templateVariables.value[varName]
}

const generatePDF = async () => {
  isGeneratingPDF.value = true

  try {
    // Ensure client-side only
    if (typeof window === 'undefined') return

    // Dynamically import PDF libraries
    const [jsPDFModule, html2canvasModule] = await Promise.all([
      jsPDF(),
      html2canvas()
    ])

    const JsPDF = jsPDFModule.default || jsPDFModule
    const Html2Canvas = html2canvasModule.default || html2canvasModule

    // Create a temporary div with the processed markdown content
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm' // A4 width
    tempDiv.style.padding = '20mm'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '12px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.color = '#000'
    tempDiv.style.backgroundColor = '#fff'

    // Convert markdown to HTML
    const md = new MarkdownIt()
    const htmlContent = md.render(processedContent.value)
    tempDiv.innerHTML = htmlContent

    // Add styles for better PDF formatting
    const style = document.createElement('style')
    style.textContent = `
      h1 { font-size: 24px; margin-bottom: 20px; color: #2563eb; }
      h2 { font-size: 20px; margin: 20px 0 15px 0; color: #1e40af; }
      h3 { font-size: 16px; margin: 15px 0 10px 0; color: #1e3a8a; }
      p { margin-bottom: 10px; }
      ul, ol { margin: 10px 0; padding-left: 20px; }
      li { margin-bottom: 5px; }
      strong { font-weight: bold; }
      em { font-style: italic; }
      hr { margin: 20px 0; border: none; border-top: 1px solid #ccc; }
    `
    document.head.appendChild(style)
    document.body.appendChild(tempDiv)

    // Generate PDF using html2canvas and jsPDF
    const canvas = await Html2Canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      // Important for external images
      proxy: undefined,
      logging: false
    })

    // Create PDF with multiple pages if needed
    const pdf = new JsPDF('p', 'mm', 'a4')
    const pageHeight = pdf.internal.pageSize.height
    const pageWidth = pdf.internal.pageSize.width
    const margin = 10

    // Add title
    pdf.setFontSize(16)
    pdf.text('Memoria Técnica', margin, margin + 10)

    // Add content
    let yPosition = margin + 20

    // Convert canvas to image and add to PDF
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = pageWidth - (margin * 2)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Handle multiple pages if content is too tall
    if (imgHeight > pageHeight - yPosition - margin) {
      // Split content across multiple pages
      let remainingHeight = imgHeight
      let sourceY = 0

      while (remainingHeight > 0) {
        const pageContentHeight = Math.min(remainingHeight, pageHeight - yPosition - margin)
        const sourceHeight = (pageContentHeight * canvas.height) / imgHeight

        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yPosition,
          imgWidth,
          pageContentHeight,
          '',
          'FAST'
        )

        remainingHeight -= pageContentHeight
        sourceY += sourceHeight

        if (remainingHeight > 0) {
          pdf.addPage()
          yPosition = margin
        }
      }
    } else {
      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
    }

    // Save PDF
    const fileName = `memoria-${templateVariables.value.nombreProyecto || 'documento'}-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Error al generar el PDF. Por favor, inténtelo de nuevo.')
  } finally {
    isGeneratingPDF.value = false
  }
}

// Initialize variables for any existing template variables
onMounted(async () => {
  console.log('🚀 Memorias - onMounted called')
  console.log('🚀 Memorias - userStore.user?._id:', userStore.user?._id)
  console.log('🚀 Memorias - templatesStore before load:', templatesStore)
  console.log('🚀 Memorias - templatesStore.allTemplates before load:', templatesStore.allTemplates)

  // Load templates from store
  try {
    console.log('🚀 Memorias - Loading templates...')
    await templatesStore.loadTemplates(userStore.user?._id)
    console.log('🚀 Memorias - Templates loaded successfully')
    console.log('🚀 Memorias - templatesStore.allTemplates after load:', templatesStore.allTemplates)
    console.log('🚀 Memorias - templatesStore.allTemplates length after load:', templatesStore.allTemplates?.length)
  } catch (error) {
    console.error('🚀 Memorias - Error loading templates:', error)
  }

  availableVariables.value.forEach((varName) => {
    if (!(varName in templateVariables.value)) {
      templateVariables.value[varName] = ''
    }
  })

  console.log('🚀 Memorias - onMounted completed')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Image Gallery -->
    <!-- <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Galería de Imágenes
          </h3>
          <div class="flex gap-2">
            <UButton @click="$refs.imageGallery?.click()" color="primary" icon="i-heroicons-photo" size="sm">
              Insertar Imagen
            </UButton>
          </div>
        </div>
      </template>

<div class="mb-4">
  <p class="text-sm text-gray-600 mb-4">
    Usa imágenes de tu galería o sube nuevas imágenes para incluirlas en el documento.
  </p>
  <DetallesGraficosComponent ref="imageGallery" />
</div>
</UCard> -->

    <!-- Template Management -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Gestión de Plantillas
          </h3>
          <div class="flex gap-2">
            <UButton
              color="primary"
              icon="i-heroicons-plus"
              size="sm"
              @click="openCreateTemplate"
            >
              Nueva Plantilla
            </UButton>
          </div>
        </div>
      </template>

      <!-- Templates by Category -->

      <div class="space-y-6">
        <div
          v-for="(templates, category) in templatesByCategory"
          :key="category"
          class="space-y-3"
        >
          <div class="flex items-center gap-2">
            <UBadge
              :label="getCategoryLabel(category)"
              variant="soft"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ templates.length }} plantilla{{ templates.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UCard
              v-for="template in templates"
              :key="template.id"
              class="group relative hover:shadow-md transition-all duration-200"
              :class="[
                selectedTemplate?.id === template.id ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : '',
                template.isGlobal ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900'
              ]"
            >
              <!-- Template Actions -->
              <div
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop
              >
                <ClientOnly>
                  <UDropdownMenu
                    :items="[
                      [{
                        label: 'Cargar',
                        icon: 'i-heroicons-arrow-down-tray',
                        onSelect: () => handleTemplateAction('cargar', template)
                      }],
                      [
                        ...(canEditTemplate(template) ? [{
                          label: 'Editar',
                          icon: 'i-heroicons-pencil',
                          onSelect: () => handleTemplateAction('editar', template)
                        }] : []),
                        {
                          label: 'Duplicar',
                          icon: 'i-heroicons-document-duplicate',
                          onSelect: () => handleTemplateAction('duplicar', template)
                        }
                      ],
                      ...(canEditTemplate(template) ? [[{
                        label: 'Eliminar',
                        icon: 'i-heroicons-trash',
                        onSelect: () => handleTemplateAction('eliminar', template)
                      }]] : [])
                    ]"
                  >
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-heroicons-ellipsis-vertical"
                      size="sm"
                    />
                  </UDropdownMenu>
                </ClientOnly>
              </div>

              <!-- Template Content -->
              <div
                class="p-4 cursor-pointer"
                @click="(template.isGlobal && userStore.user.role !== 'admin') ? handleTemplateAction('cargar', template) : openEditTemplate(template)"
              >
                <div class="flex items-start justify-between mb-2">
                  <h4 class="font-medium text-gray-900 dark:text-white pr-8">
                    {{ template.name }}
                    <UBadge
                      v-if="template.isDefault"
                      label="Por defecto"
                      color="primary"
                      variant="soft"
                      size="xs"
                      class="ml-2"
                    />
                  </h4>
                </div>

                <p
                  v-if="template.description"
                  class="text-sm text-gray-600 dark:text-gray-400 mb-3"
                >
                  {{ template.description }}
                </p>

                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                  {{ template.content.substring(0, 120) }}...
                </p>

                <div class="flex items-center justify-between text-xs text-gray-400">
                  <span v-if="template.updatedAt">
                    Actualizada: {{ new Date(template.updatedAt).toLocaleDateString('es-ES') }}
                  </span>
                  <UPopover
                    v-if="template.isGlobal"
                    mode="hover"
                  >
                    <UBadge
                      label="Global"
                      color="success"
                      variant="soft"
                      size="xs"
                    />
                    <template #panel>
                      <div class="p-2 text-xs">
                        Plantilla global - solo lectura
                      </div>
                    </template>
                  </UPopover>
                  <UIcon
                    v-if="selectedTemplate?._id === template._id"
                    name="i-heroicons-check-circle"
                    class="text-primary-500"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="savedTemplates.length === 0"
          class="text-center py-12"
        >
          <UIcon
            name="i-heroicons-document-text"
            class="text-4xl text-gray-400 mb-4"
          />
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay plantillas guardadas
          </h4>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Crea tu primera plantilla para reutilizar contenido
          </p>
          <UButton
            color="primary"
            icon="i-heroicons-plus"
            @click="openCreateTemplate"
          >
            Crear Primera Plantilla
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Variable Editor
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Variables de Plantilla
          </h3>
          <div class="flex gap-2">
            <UButton @click="addVariable" color="primary" variant="outline" size="sm" icon="i-heroicons-plus">
              Agregar Variable
            </UButton>
            <UButton @click="showVariableEditor = !showVariableEditor" :color="showVariableEditor ? 'error' : 'neutral'"
              variant="outline" size="sm" :icon="showVariableEditor ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'">
              {{ showVariableEditor ? 'Ocultar' : 'Mostrar' }}
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="showVariableEditor" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField v-for="(value, key) in templateVariables" :key="key" :label="String(key)">
            <div class="flex gap-2">
              <UInput v-model="templateVariables[key]" :placeholder="`Valor para ${key}`" class="flex-1" />
              <UButton @click="removeVariable(String(key))" color="error" variant="ghost" size="sm"
                icon="i-heroicons-trash" />
            </div>
          </UFormField>
        </div>

        <div v-if="availableVariables.length > 0" class="mt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Variables detectadas en el contenido:
          </h4>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="variable in availableVariables" :key="variable"
              :color="templateVariables[variable] ? 'success' : 'warning'" variant="subtle">
              {{ variable }}
            </UBadge>
          </div>
        </div>
      </div>
    </UCard> -->

    <!-- Delete Confirmation Modal handled via overlay pattern -->
  </div>
</template>
