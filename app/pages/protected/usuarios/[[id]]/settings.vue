<script lang="ts" setup>
// Import critical components directly
import TableMasterData from '~/components/TableMasterData.vue'
import TablePresupuestoData from '~/components/TablePresupuestoData.vue'
import UserPartidasManager from '~/components/UserPartidasManager.vue'
import QRConfigForm from '~/components/qr/QRConfigForm.vue'

// Lazy load heavy components (only loaded when needed)
const Memorias = defineAsyncComponent(() => import('@/components/Memorias.vue'))
const DetallesGraficosComponent = defineAsyncComponent(() => import('@/components/DetallesGraficosComponent.vue'))
// Modal component - will be lazy loaded via overlay
import { LazyModalTemplateCreate } from '#components'
import { useTemplatesStore } from '@/stores/templates'
import { useMasterTablesStore, type MasterTableType } from '~/stores/masterTables'
import { useUserStore } from '@/stores/user'
import { usePresupuestosStore, type ConceptodePresupuesto } from '~/stores/presupuestos'
import { getPlanTemplateVariables } from '@/utils/planVariables'
import type { QRSettings } from '~/types/qr'

// Template variables for modal - dynamically generated from Plan interface

definePageMeta({ middleware: 'auth', layout: 'app' })

// Debug logging
console.log('Settings page loaded')
console.log('Current route:', useRoute().path)
console.log('User ID from route:', useRoute().params.id)

const templatesStore = useTemplatesStore()
const masterTablesStore = useMasterTablesStore()
const userStore = useUserStore()
const presupuestosStore = usePresupuestosStore()

// Modal overlay setup (following working example)
const overlay = useOverlay()
const editingTemplate = ref<any>(null)

// fimodal
// Define the type for select items
interface SelectItem {
  value: string
  label: string
}

// Available master table types
const masterTableTypes: SelectItem[] = [
  { value: 'tipo_concepto_unidad', label: 'Tipos de Concepto/Unidad' },
  { value: 'capitulo', label: 'Capítulos' },
  { value: 'riesgo', label: 'Riesgos' },
  { value: 'probabilidad', label: 'Probabilidad' },
  { value: 'gravedad', label: 'Gravedad' },
  { value: 'epi', label: 'EPIs' },
  { value: 'pqs', label: 'Productos químicos' },
  { value: 'maq', label: 'Máquinas' },
  { value: 'pcol', label: 'Protecciones colectivas' },
  { value: 'medaux', label: 'Medios auxiliares' }
]

// Current selected master table type
const currentTableType = ref<MasterTableType>('capitulo')
const isLoading = ref(false)

// Load master tables when table type changes
watch(currentTableType, async (newType) => {
  isLoading.value = true
  try {
    await masterTablesStore.setCurrentTable(newType)
  } finally {
    isLoading.value = false
  }
}, { immediate: true })

// Load master tables and presupuesto data when user is available
watch(() => userStore.user, async (newUser) => {
  console.log('🔍 [SETTINGS] User changed:', newUser?._id)
  if (newUser?._id) {
    isLoading.value = true
    try {
      console.log('🔍 [SETTINGS] Loading master tables and presupuesto data for user:', newUser._id)
      // Load master tables
      await masterTablesStore.setCurrentTable(currentTableType.value)

      // Load presupuesto data
      console.log('🔍 [SETTINGS] Loading presupuesto data for user:', newUser._id)
      await Promise.all([
        presupuestosStore.loadUserPresupuesto(newUser._id),
        presupuestosStore.loadAdminPresupuesto()
      ])
      console.log('🔍 [SETTINGS] Admin presupuesto loaded:', presupuestosStore.adminPresupuesto)
      console.log('🔍 [SETTINGS] User presupuesto loaded:', presupuestosStore.userPresupuesto)
    } catch (error) {
      console.error('🔍 [SETTINGS] Error loading data:', error)
    } finally {
      isLoading.value = false
    }
  }
}, { immediate: true })

// Navigation tabs
const items = [{
  label: 'Administracion Memorias',
  icon: 'i-heroicons-book-open-solid',
  value: 'memorias',
  slot: 'memorias'
}, {
  label: 'Detalles Gráficos de usuario',
  icon: 'i-heroicons-photo',
  value: 'detallesgraficos',
  slot: 'detallesgraficos'
}, {
  label: 'Tablas Maestras',
  icon: 'i-heroicons-table-cells',
  value: 'mastertable',
  slot: 'mastertable'
}, {
  label: 'Configuración de App',
  icon: 'i-heroicons-cog-6-tooth',
  value: 'appsettings',
  slot: 'appsettings'
}, {
  label: 'Configuración de Presupuesto',
  icon: 'i-heroicons-calculator',
  value: 'presupuestosettings',
  slot: 'presupuestosettings'
},
//  {
//   label: 'Mis Capítulos por Defecto',
//   icon: 'i-heroicons-folder',
//   value: 'defaultcapitulos',
//   slot: 'defaultcapitulos',
// },
{
  label: 'Mis Partidas por Defecto',
  icon: 'i-heroicons-list-bullet',
  value: 'defaultpartidas',
  slot: 'defaultpartidas'
},
//  {
//   label: 'Mi Presupuesto por Defecto',
//   icon: 'i-heroicons-currency-euro',
//   value: 'defaultpresupuesto',
//   slot: 'defaultpresupuesto',
// },
{
  label: 'QR',
  icon: 'i-heroicons-qr-code',
  value: 'qrs',
  slot: 'qrs'
}]

// Admin-only items
const adminItems = [{
  label: 'Herramientas de Administrador',
  icon: 'i-heroicons-shield-check',
  value: 'admin-tools',
  slot: 'admin-tools'
}]

// Combined items (regular + admin if user is admin)
const allItems = computed(() => {
  return isAdmin.value ? [...items, ...adminItems] : items
})

const route = useRoute()
const router = useRouter()

// Active tab synced with URL hash for contextual help
const activeTab = ref<string>('memorias')

function resolveTabFromHash(): string {
  const hash = route.hash.replace('#', '')
  const exists = allItems.value.some(i => i.value === hash)
  return exists ? hash : 'memorias'
}

onMounted(() => {
  activeTab.value = resolveTabFromHash()
})

watch(() => route.hash, () => {
  activeTab.value = resolveTabFromHash()
})

watch(activeTab, (val) => {
  if (val && route.hash !== `#${val}`) {
    router.replace({ hash: `#${val}` })
  }
})

// Handle tab changes
function onChange(index: number) {
  const item = allItems.value[index]
  if (item?.value) {
    activeTab.value = item.value
  }
}

// Handle master table events
const handleCreateItem = async (item: any) => {
  try {
    await masterTablesStore.createItem(currentTableType.value, item)
  } catch (error) {
    console.error('Error creating item:', error)
    throw error
  }
}

const handleUpdateItem = async (item: any) => {
  if (!item._id) return

  try {
    await masterTablesStore.updateItem(currentTableType.value, item._id, item)
  } catch (error) {
    console.error('Error updating item:', error)
    throw error
  }
}

const handleDeleteItem = async (id: string) => {
  try {
    await masterTablesStore.deleteItem(currentTableType.value, id)
  } catch (error) {
    console.error('Error deleting item:', error)
    throw error
  }
}

const handleResetToDefault = async () => {
  try {
    await masterTablesStore.resetToDefault(currentTableType.value)
  } catch (error) {
    console.error('Error resetting to default:', error)
    throw error
  }
}

const handleCopyFromDefault = async () => {
  try {
    await masterTablesStore.copyFromDefault(currentTableType.value)
  } catch (error) {
    console.error('Error copying from default:', error)
    throw error
  }
}

// Handle presupuesto events
const handleCreatePresupuestoItem = async (item: Partial<ConceptodePresupuesto>) => {
  if (!userStore.user?._id) return

  try {
    await presupuestosStore.createUserPresupuestoItem(userStore.user._id, {
      concepto: item.concepto || '',
      tipo: item.tipo || '',
      ud: item.ud || 0,
      precioud: item.precioud || 0,
      amortizacion: item.amortizacion || 100,
      total: item.total || 0
    })
  } catch (error) {
    console.error('Error creating presupuesto item:', error)
    throw error
  }
}

const handleUpdatePresupuestoItem = async (item: Partial<ConceptodePresupuesto>) => {
  if (!userStore.user?._id || !item.id) return

  try {
    await presupuestosStore.updateUserPresupuestoItem(userStore.user._id, item.id, item)
  } catch (error) {
    console.error('Error updating presupuesto item:', error)
    throw error
  }
}

const handleDeletePresupuestoItem = async (id: string) => {
  if (!userStore.user?._id) return

  try {
    await presupuestosStore.deleteUserPresupuestoItem(userStore.user._id, parseInt(id))
  } catch (error) {
    console.error('Error deleting presupuesto item:', error)
    throw error
  }
}

const handleResetPresupuestoToDefaults = async () => {
  if (!userStore.user?._id) return

  try {
    await presupuestosStore.resetUserPresupuestoToDefaults(userStore.user._id)
  } catch (error) {
    console.error('Error resetting presupuesto to defaults:', error)
    throw error
  }
}

const handleCopyPresupuestoFromDefaults = async () => {
  if (!userStore.user?._id) return

  try {
    await presupuestosStore.copyUserPresupuestoFromDefaults(userStore.user._id)
  } catch (error) {
    console.error('Error copying presupuesto from defaults:', error)
    throw error
  }
}

// App settings state - wait for user data to be loaded
const appSettingsForm = reactive({
  persistCapitulosPerPlan: false,
  persistPartidasPerPlan: false,
  persistPresupuestoPerPlan: false,
  autoLoadUserDefaults: true
})

// Watch for user data changes and update form
watch(() => userStore.user, (newUser) => {
  if (newUser && newUser.appSettings) {
    console.log('User appSettings loaded:', newUser.appSettings)
    appSettingsForm.persistCapitulosPerPlan = newUser.appSettings.persistCapitulosPerPlan ?? false
    appSettingsForm.persistPartidasPerPlan = newUser.appSettings.persistPartidasPerPlan ?? false
    appSettingsForm.persistPresupuestoPerPlan = newUser.appSettings.persistPresupuestoPerPlan ?? false
    appSettingsForm.autoLoadUserDefaults = newUser.appSettings.autoLoadUserDefaults ?? true
  } else {
    console.log('User or appSettings not available:', newUser)
  }
}, { immediate: true, deep: true })

const isUpdatingSettings = ref(false)

// Save app settings
const saveAppSettings = async () => {
  isUpdatingSettings.value = true
  try {
    await userStore.updateAppSettings(appSettingsForm)
    // Show success toast
    const toast = useToast()
    toast.add({
      title: 'Configuración guardada',
      description: 'Los ajustes de la aplicación se han guardado correctamente.',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error saving app settings:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.message || 'Error al guardar la configuración',
      color: 'error'
    })
  } finally {
    isUpdatingSettings.value = false
  }
}

// Handle admin presupuesto events
const handleCreateAdminPresupuestoItem = async (item: Partial<ConceptodePresupuesto>) => {
  try {
    const response = await $fetch('/api/admin/presupuesto-defaults', {
      method: 'POST',
      body: {
        id: item.id || Date.now(),
        concepto: item.concepto || '',
        tipo: item.tipo || '',
        ud: item.ud || 0,
        precioud: item.precioud || 0,
        total: item.total || 0
      }
    })

    // Refresh admin presupuesto data
    await presupuestosStore.loadAdminPresupuesto()

    const toast = useToast()
    toast.add({
      title: 'Concepto creado',
      description: 'El concepto de presupuesto se ha añadido a los valores por defecto.',
      color: 'success'
    })
  } catch (error) {
    console.error('Error creating admin presupuesto item:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al crear el concepto de presupuesto',
      color: 'error'
    })
    throw error
  }
}

const handleUpdateAdminPresupuestoItem = async (item: Partial<ConceptodePresupuesto>) => {
  if (!item.id) return

  try {
    await $fetch('/api/admin/presupuesto-defaults', {
      method: 'PUT',
      body: {
        id: item.id,
        concepto: item.concepto || '',
        tipo: item.tipo || '',
        ud: item.ud || 0,
        precioud: item.precioud || 0,
        total: item.total || 0
      }
    })

    // Refresh admin presupuesto data
    await presupuestosStore.loadAdminPresupuesto()

    const toast = useToast()
    toast.add({
      title: 'Concepto actualizado',
      description: 'El concepto de presupuesto se ha actualizado en los valores por defecto.',
      color: 'success'
    })
  } catch (error) {
    console.error('Error updating admin presupuesto item:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al actualizar el concepto de presupuesto',
      color: 'error'
    })
    throw error
  }
}

const handleDeleteAdminPresupuestoItem = async (id: string) => {
  try {
    await $fetch('/api/admin/presupuesto-defaults', {
      method: 'DELETE',
      body: { id: parseInt(id) }
    })

    // Refresh admin presupuesto data
    await presupuestosStore.loadAdminPresupuesto()

    const toast = useToast()
    toast.add({
      title: 'Concepto eliminado',
      description: 'El concepto de presupuesto se ha eliminado de los valores por defecto.',
      color: 'success'
    })
  } catch (error) {
    console.error('Error deleting admin presupuesto item:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al eliminar el concepto de presupuesto',
      color: 'error'
    })
    throw error
  }
}

// Navigation function
const navigateToPlans = () => {
  navigateTo('/protected/logged')
}

const templateVariables = getPlanTemplateVariables()

// Admin check
const isAdmin = computed(() => {
  return userStore.user?.role === 'admin' || userStore.user?.mgroluser === 'admin'
})

// Batch update state
const isUpdatingCapitulos = ref(false)
const updateResult = ref<any>(null)
const showUpdateResult = ref(false)

// Modal functions using overlay pattern with lazy-loaded components
const openTemplateModal = async () => {
  editingTemplate.value = null

  // Create modal instance using Lazy component - Nuxt UI v4 pattern
  const modal = overlay.create(LazyModalTemplateCreate)

  try {
    // Open with props and await result - returns a Promise
    const result = await modal.open({
      title: 'Nueva Plantilla de Memoria',
      availableVariables: templateVariables,
      defaultContent: `# Plan de Seguridad y Salud

## {{nom_obra}}

**Dirección:** {{dir_obra}}, {{poblacion_obra}} ({{cp_obra}})
**Duración:** {{duracion_meses}} meses
**Presupuesto Total:** €{{presupuesto_total_obra}}

### Contratista
- **Empresa:** {{nom_contratista}}
- **CIF:** {{cif_contratista}}
- **Dirección:** {{dir_contratista}}

### Promotor
- **Nombre:** {{nom_promotor}}
- **CIF:** {{cif_promotor}}
- **Dirección:** {{dir_promotor}}

### Descripción de la Obra
{{desc_obra}}

### Condiciones de la Obra
{{desc_condiciones_obra}}`,
      showSave: true,
      showVariables: true
    })

    console.log('Template modal closed with result:', result)
    if (result && typeof result === 'object' && result.name) {
      await handleTemplateSave(result)
    }
  } catch (error) {
    console.error('Error with template modal:', error)
  }
}

const openEditTemplateModal = async (template: any) => {
  console.log('📝 Settings - openEditTemplateModal called with template:', template)
  console.log('📝 Settings - template._id:', template._id)
  console.log('📝 Settings - template.name:', template.name)
  console.log('📝 Settings - template.content:', template.content)

  editingTemplate.value = template

  // Create modal instance using Lazy component - Nuxt UI v4 pattern
  const modal = overlay.create(LazyModalTemplateCreate)

  try {
    console.log('📝 Settings - About to open edit template modal...')

    // Open with props and await result - returns a Promise
    const result = await modal.open({
      title: 'Editar Plantilla de Memoria',
      template: template,
      availableVariables: templateVariables,
      showSave: true,
      showVariables: true
    })

    console.log('📝 Settings - Edit template modal closed with result:', result)
    if (result && typeof result === 'object' && result.name) {
      await handleTemplateSave({ ...result, id: template._id || template.id })
    }
  } catch (error) {
    console.error('📝 Settings - Error with edit template modal:', error)
  }
}

async function handleTemplateSave(template: any) {
  console.log('💾 Settings - handleTemplateSave called with template:', template)
  console.log('💾 Settings - editingTemplate.value:', editingTemplate.value)
  console.log('💾 Settings - userStore.user._id:', userStore.user._id)

  try {
    const toast = useToast()

    if (editingTemplate.value) {
      // Update existing template
      console.log('💾 Settings - Updating existing template with ID:', editingTemplate.value._id || editingTemplate.value.id)
      await templatesStore.updateTemplate(editingTemplate.value._id || editingTemplate.value.id, template)
      console.log('💾 Settings - Template updated successfully')
      toast.add({
        title: 'Plantilla actualizada',
        description: 'La plantilla se ha actualizado correctamente.',
        color: 'success'
      })
    } else {
      // Create new template
      console.log('💾 Settings - Creating new template')
      const result = await templatesStore.createTemplate(template)
      console.log('💾 Settings - Template created successfully, result:', result)
      toast.add({
        title: 'Plantilla creada',
        description: 'La plantilla se ha creado correctamente.',
        color: 'success'
      })
    }

    // Refresh templates list
    console.log('💾 Settings - Refreshing templates list...')
    console.log('💾 Settings - templatesStore.allTemplates before refresh:', templatesStore.allTemplates)
    await templatesStore.loadTemplates(userStore.user._id)
    console.log('💾 Settings - Templates refreshed successfully')
    console.log('💾 Settings - templatesStore.allTemplates after refresh:', templatesStore.allTemplates)
    console.log('💾 Settings - templatesStore.allTemplates length after refresh:', templatesStore.allTemplates?.length)
  } catch (error: any) {
    console.error('💾 Settings - Error in handleTemplateSave:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.message || 'Error al guardar la plantilla',
      color: 'error'
    })
  }
}

// Populate capitulo titles for all conceptos
const populateCapituloTitles = async () => {
  if (!isAdmin.value) {
    const toast = useToast()
    toast.add({
      title: 'Acceso denegado',
      description: 'Esta función solo está disponible para administradores',
      color: 'error'
    })
    return
  }

  isUpdatingCapitulos.value = true
  updateResult.value = null
  showUpdateResult.value = false

  try {
    const response = await $fetch('/api/admin/populate-capitulo-titles', {
      method: 'POST'
    })

    updateResult.value = response
    showUpdateResult.value = true

    const toast = useToast()
    if (response.success) {
      toast.add({
        title: 'Actualización completada',
        description: `Se han actualizado ${response.updated} conceptos. Omitidos: ${response.skipped}`,
        color: 'success'
      })
    } else {
      toast.add({
        title: 'Error en la actualización',
        description: response.message || 'Ha ocurrido un error durante la actualización',
        color: 'error'
      })
    }
  } catch (error: any) {
    console.error('Error populating capitulo titles:', error)
    updateResult.value = {
      success: false,
      message: error.message || 'Error al conectar con el servidor',
      updated: 0,
      skipped: 0,
      errors: [error.message]
    }
    showUpdateResult.value = true

    const toast = useToast()
    toast.add({
      title: 'Error de conexión',
      description: 'No se ha podido conectar con el servidor',
      color: 'error'
    })
  } finally {
    isUpdatingCapitulos.value = false
  }
}
// QR Settings state
const qrSettings = ref<QRSettings>({
  autoGenerate: true,
  baseUrl: 'http://localhost:3000',
  expirationDays: 30
})
const qrLoading = ref(false)
const qrSaving = ref(false)

// Load QR settings
const loadQRSettings = async () => {
  try {
    qrLoading.value = true
    const settings = await userStore.getQRSettings()
    qrSettings.value = settings
  } catch (error) {
    console.error('Error loading QR settings:', error)
  } finally {
    qrLoading.value = false
  }
}

// Update QR settings
const updateQRSettings = async (settings: QRSettings) => {
  try {
    await userStore.updateQRSettings(settings)
    qrSettings.value = settings
    const toast = useToast()
    toast.add({
      title: 'Configuración QR actualizada',
      description: 'Tus preferencias de códigos QR se han actualizado correctamente',
      color: 'success'
    })
  } catch (error: any) {
    console.error('Error updating QR settings:', error)
    throw error
  }
}

// Reset QR settings
const resetQRSettings = async () => {
  await loadQRSettings()
  const toast = useToast()
  toast.add({
    title: 'Configuración restablecida',
    description: 'Se han cargado los valores guardados',
    color: 'blue'
  })
}

// Load QR settings when user is available
watch(() => userStore.user, (newUser) => {
  if (newUser?._id) {
    loadQRSettings()
  }
}, { immediate: true })

// Test modal removed - using overlay pattern for template modal
</script>

<template>
  <UTabs
    v-model="activeTab"
    :items="allItems"
    class="w-full"
    @change="onChange"
  >
    <template #memorias="{ item }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ item.label }}
            </h3>
            <!-- <UButton color="primary" variant="soft" size="sm" icon="i-heroicons-plus" @click="openTemplateModal">
              Crear Plantilla
            </UButton> -->
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Gestiona las plantillas de memorias para tus planes de seguridad
            </p>
          </div>

          <Memorias
            @create-template="openTemplateModal"
            @edit-template="(template) => openEditTemplateModal(template)"
          />
        </div>
      </UCard>
    </template>

    <template #detallesgraficos="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>
        <DetallesGraficosComponent />
      </UCard>
    </template>

    <template #mastertable="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>

        <div class="space-y-6">
          <!-- Table Type Selector -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="w-full sm:w-1/3">
              <UFormField
                label="Seleccionar tabla"
                for="table-type"
              >
                <USelect
                  v-model="currentTableType"
                  :items="masterTableTypes"
                  :loading="isLoading"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex gap-2 w-full sm:w-auto">
              <UButton
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-path"
                label="Restablecer por defecto"
                :loading="isLoading"
                class="flex-1 sm:flex-none"
                @click="handleResetToDefault"
              />
              <UButton
                color="primary"
                icon="i-heroicons-document-duplicate"
                label="Copiar de valores por defecto"
                :loading="isLoading"
                class="flex-1 sm:flex-none"
                @click="handleCopyFromDefault"
              />
            </div>
          </div>

          <!-- Default Values Table -->
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700">
              Valores por defecto
            </h4>
            <TableMasterData
              :table-type="currentTableType"
              :items="masterTablesStore.defaultTables[currentTableType]"
              :default-items="masterTablesStore.defaultTables[currentTableType]"
              :is-loading="isLoading"
              :can-edit-default="true"
              :is-default="true"
              :columns="masterTablesStore.getTableColumns(currentTableType)"
              @create="handleCreateItem"
              @update="handleUpdateItem"
              @delete="handleDeleteItem"
              @reset="handleResetToDefault"
            />
          </div>

          <!-- User Values Table -->
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700">
              Mis valores
            </h4>
            <TableMasterData
              :table-type="currentTableType"
              :items="masterTablesStore.userTables[currentTableType]"
              :default-items="masterTablesStore.defaultTables[currentTableType]"
              :is-loading="isLoading"
              :can-edit-default="false"
              :is-default="false"
              :columns="masterTablesStore.getTableColumns(currentTableType)"
              @create="handleCreateItem"
              @update="handleUpdateItem"
              @delete="handleDeleteItem"
              @reset="handleResetToDefault"
            />
          </div>
        </div>
      </UCard>
    </template>

    <template #appsettings="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>

        <div class="space-y-6">
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">
              Persistencia de Capítulos y Partidas
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Configura cómo se gestionan los capítulos y partidas en tus planes.
            </p>
          </div>

          <div class="space-y-6">
            <!-- Persist Capitulos Per Plan -->
            <div class="flex items-center justify-between py-4">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                  Persistir capítulos por plan
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Guarda capítulos personalizados para cada plan en lugar de usar los capítulos globales del usuario.
                </p>
              </div>
              <USwitch
                v-model="appSettingsForm.persistCapitulosPerPlan"
                :disabled="isUpdatingSettings"
              />
            </div>

            <!-- Persist Partidas Per Plan -->
            <div class="flex items-center justify-between py-4">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                  Persistir partidas por plan
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Guarda partidas personalizadas para cada plan en lugar de usar las partidas globales del usuario.
                </p>
              </div>
              <USwitch
                v-model="appSettingsForm.persistPartidasPerPlan"
                :disabled="isUpdatingSettings"
              />
            </div>

            <!-- Persist Presupuesto Per Plan -->
            <div class="flex items-center justify-between py-4">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                  Persistir presupuesto por plan
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Guarda presupuesto personalizado para cada plan en lugar de usar el presupuesto global del usuario.
                </p>
              </div>
              <USwitch
                v-model="appSettingsForm.persistPresupuestoPerPlan"
                :disabled="isUpdatingSettings"
              />
            </div>

            <!-- Auto Load User Defaults -->
            <div class="flex items-center justify-between py-4">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                  Cargar automáticamente valores por defecto del usuario
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Si un plan no tiene datos específicos, usar valores del usuario en lugar de valores del administrador.
                </p>
              </div>
              <USwitch
                v-model="appSettingsForm.autoLoadUserDefaults"
                :disabled="isUpdatingSettings"
              />
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton
              color="primary"
              icon="i-heroicons-check"
              label="Guardar configuración"
              :loading="isUpdatingSettings"
              @click="saveAppSettings"
            />
          </div>
        </div>
      </UCard>
    </template>

    <template #presupuestosettings="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>

        <div class="space-y-6">
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">
              Gestión de Presupuesto Personal
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Administra tus conceptos de presupuesto personalizados. Estos se usarán en tus planes cuando no tengas
              presupuesto
              específico.
            </p>
          </div>

          <!-- Configuration Settings -->
          <div class="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
            <!-- Persist Presupuesto Per Plan -->
            <div class="flex items-center justify-between py-4">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                  Persistir presupuesto por plan
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Guarda presupuesto personalizado para cada plan en lugar de usar el presupuesto global del usuario.
                </p>
              </div>
              <USwitch
                v-model="appSettingsForm.persistPresupuestoPerPlan"
                :disabled="isUpdatingSettings"
              />
            </div>

            <!-- Auto Load User Defaults -->
            <div class="flex items-center justify-between py-4">
              <div class="flex-1">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                  Cargar automáticamente valores por defecto del usuario
                </h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Si un plan no tiene presupuesto específico, usar tus valores personalizados en lugar de valores del
                  administrador.
                </p>
              </div>
              <USwitch
                v-model="appSettingsForm.autoLoadUserDefaults"
                :disabled="isUpdatingSettings"
              />
            </div>
          </div>

          <!-- CRUD Interface -->
          <div class="space-y-6">
            <!-- Admin Defaults (Editable for admins) -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700">
                Valores por defecto del administrador
                <span class="text-xs text-gray-500 ml-2">({{ presupuestosStore.adminPresupuesto.length }} items)</span>
              </h4>
              <div
                v-if="!isLoading && presupuestosStore.adminPresupuesto.length === 0"
                class="text-sm text-gray-500"
              >
                No hay valores por defecto cargados. Verifica la consola para debugging.
              </div>
              <div v-else>
                <TablePresupuestoData
                  :items="presupuestosStore.adminPresupuesto"
                  :is-loading="isLoading"
                  :can-edit-default="true"
                  :is-default="true"
                  @create="handleCreateAdminPresupuestoItem"
                  @update="handleUpdateAdminPresupuestoItem"
                  @delete="handleDeleteAdminPresupuestoItem"
                />
              </div>
            </div>

            <!-- User Items (Editable) -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700">
                Mis conceptos de presupuesto
              </h4>
              <div class="flex gap-2 mb-4">
                <UButton
                  color="primary"
                  variant="soft"
                  icon="i-heroicons-arrow-path"
                  label="Restablecer"
                  :loading="isLoading"
                  @click="handleResetPresupuestoToDefaults"
                />
                <UButton
                  color="primary"
                  icon="i-heroicons-document-duplicate"
                  label="Copiar de valores por defecto"
                  :loading="isLoading"
                  @click="handleCopyPresupuestoFromDefaults"
                />
              </div>
              <TablePresupuestoData
                :items="presupuestosStore.userPresupuesto"
                :is-loading="isLoading"
                :can-edit-default="true"
                :is-default="false"
                @create="handleCreatePresupuestoItem"
                @update="handleUpdatePresupuestoItem"
                @delete="handleDeletePresupuestoItem"
              />
            </div>
          </div>

          <!-- Save Configuration Button -->
          <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton
              color="primary"
              icon="i-heroicons-check"
              :loading="isUpdatingSettings"
              @click="saveAppSettings"
            >
              Guardar Configuración
            </UButton>
          </div>
        </div>
      </UCard>
    </template>

    <!-- <template #defaultcapitulos="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>

        <div class="space-y-6">
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">
              Gestión de Capítulos por Defecto
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Define tus capítulos por defecto que se usarán como fallback cuando no existan capítulos específicos del
              plan.
            </p>
          </div>

          <div class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div class="flex items-start space-x-3">
                <UIcon name="i-heroicons-information-circle" class="text-blue-500 mt-0.5" />
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  <p class="font-medium mb-1">¿Cómo funciona?</p>
                  <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Estos capítulos se usarán cuando no existan capítulos específicos del plan</li>
                    <li>Puedes personalizar tus capítulos desde la pestaña "Tablas Maestras"</li>
                    <li>Si no tienes capítulos personalizados, se usarán los valores del administrador</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="text-center py-8">
              <UIcon name="i-heroicons-folder" class="text-4xl text-gray-400 mb-4" />
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Gestiona tus capítulos desde la pestaña "Tablas Maestras"
              </p>
              <UButton color="primary" variant="soft" icon="i-heroicons-arrow-right" label="Ir a Tablas Maestras"
                @click="() => { onChange(2) }" />
            </div>
          </div>
        </div>
      </UCard>
    </template> -->

    <template #defaultpartidas="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>
        <UserPartidasManager />
      </UCard>
    </template>

    <!-- <template #defaultpresupuesto="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>

        <div class="space-y-6">
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">
              Gestión de Presupuesto por Defecto
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Define tu presupuesto por defecto que se usará como fallback cuando no exista presupuesto específico del
              plan.
            </p>
          </div>

          <div class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div class="flex items-start space-x-3">
                <UIcon name="i-heroicons-information-circle" class="text-blue-500 mt-0.5" />
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  <p class="font-medium mb-1">¿Cómo funciona?</p>
                  <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Este presupuesto se usará cuando no exista presupuesto específico del plan</li>
                    <li>Puedes personalizar tu presupuesto desde cualquier plan</li>
                    <li>Si no tienes presupuesto personalizado, se usarán los valores del administrador</li>
                  </ul>
                </div>
              </div>just
            </div>

            <div class="text-center py-8">
              <UIcon name="i-heroicons-currency-euro" class="text-4xl text-gray-400 mb-4" />
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Personaliza tu presupuesto desde cualquier plan
              </p>
              <UButton color="primary" variant="soft" icon="i-heroicons-arrow-right" label="Ir a un Plan"
                @click="() => { navigateToPlans() }" />
            </div>
          </div>
        </div>
      </UCard>
    </template> -->

    <template #qrs="{ item }">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ item.label }}
          </h3>
        </template>

        <div class="space-y-6">
          <!-- Info Card -->
          <UAlert
            icon="i-heroicons-information-circle"
            color="blue"
            variant="soft"
            title="Acerca de los Códigos QR"
            description="Los códigos QR permiten el acceso público a tus planes mediante un enlace escaneable. Puedes configurar la URL base, si se generan automáticamente al crear planes y el período de validez."
          />

          <!-- QR Settings Form -->
          <QRConfigForm
            :model-value="qrSettings"
            :loading="qrSaving"
            @save="updateQRSettings"
            @reset="resetQRSettings"
          />

          <!-- Additional Info Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <!-- How it works -->
            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 class="flex items-center gap-2 text-sm font-medium mb-3">
                <UIcon
                  name="i-heroicons-light-bulb"
                  class="w-4 h-4 text-yellow-500"
                />
                Cómo funciona
              </h4>
              <ul class="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li class="flex gap-2">
                  <span class="font-medium">1.</span>
                  <span>Al crear un plan, se genera un código QR automáticamente (si está activado)</span>
                </li>
                <li class="flex gap-2">
                  <span class="font-medium">2.</span>
                  <span>El código QR contiene un enlace público único con fecha de expiración</span>
                </li>
                <li class="flex gap-2">
                  <span class="font-medium">3.</span>
                  <span>Al escanear el QR, cualquiera puede ver el plan y descargar el PDF</span>
                </li>
                <li class="flex gap-2">
                  <span class="font-medium">4.</span>
                  <span>El código QR se incrusta automáticamente en el PDF del plan</span>
                </li>
              </ul>
            </div>

            <!-- Tips -->
            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 class="flex items-center gap-2 text-sm font-medium mb-3">
                <UIcon
                  name="i-heroicons-sparkles"
                  class="w-4 h-4 text-purple-500"
                />
                Consejos
              </h4>
              <ul class="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li class="flex gap-2">
                  <span>📱</span>
                  <span>Usa una URL base corta y fácil de recordar para compartir códigos QR</span>
                </li>
                <li class="flex gap-2">
                  <span>⏰</span>
                  <span>Elige un período de expiración según la duración de tus proyectos</span>
                </li>
                <li class="flex gap-2">
                  <span>🔄</span>
                  <span>Puedes regenerar códigos QR con un nuevo token desde la página del plan</span>
                </li>
                <li class="flex gap-2">
                  <span>📊</span>
                  <span>Los códigos QR deshabilitados no permiten el acceso público</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Current QR Codes Summary -->
          <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-qr-code"
                  class="w-4 h-4 text-primary"
                />
                <h4 class="text-sm font-medium">
                  Mis Códigos QR Activos
                </h4>
              </div>
              <UButton
                icon="i-heroicons-arrow-right"
                variant="outline"
                size="xs"
                to="/protected/logged"
              >
                Ver planes
              </UButton>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              Los códigos QR se gestionan desde la página de cada plan. Ve a "Mis Planes" para ver y gestionar los códigos QR de cada plan.
            </p>
          </div>
        </div>
      </UCard>
    </template>

    <template #admin-tools="{ item }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <UIcon
                name="i-heroicons-shield-check"
                class="w-5 h-5 text-red-500"
              />
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                {{ item.label }}
              </h3>
            </div>
            <UBadge
              color="red"
              variant="soft"
              size="sm"
            >
              Solo Administradores
            </UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Capitulo Title Population Tool -->
          <UCard class="border-l-4 border-l-blue-500">
            <template #header>
              <div class="flex items-center space-x-2">
                <UIcon
                  name="i-heroicons-document-text"
                  class="w-5 h-5 text-blue-500"
                />
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                  Rellenar Nombres de Capítulos
                </h4>
              </div>
            </template>

            <div class="space-y-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="text-blue-500 mt-0.5 flex-shrink-0"
                  />
                  <div class="text-sm text-blue-700 dark:text-blue-300">
                    <p class="font-medium mb-2">
                      ¿Qué hace esta herramienta?
                    </p>
                    <ul class="list-disc list-inside space-y-1 text-xs">
                      <li>Busca todos los conceptos que no tienen nombre de capítulo (capitulo_title)</li>
                      <li>Asigna automáticamente el nombre correspondiente según el número de capítulo</li>
                      <li>Actualiza masivamente los registros existentes en la base de datos</li>
                      <li>Mejora el rendimiento al no tener que buscar nombres de capítulos en cada generación de PDF</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                  <UIcon
                    name="i-heroicons-exclamation-triangle"
                    class="text-amber-500 mt-0.5 flex-shrink-0"
                  />
                  <div class="text-sm text-amber-700 dark:text-amber-300">
                    <p class="font-medium mb-1">
                      ⚠️ Advertencia
                    </p>
                    <p class="text-xs">
                      Esta acción modificará múltiples registros en la base de datos.
                      Asegúrate de tener una copia de seguridad antes de proceder.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Update Button -->
              <div class="flex justify-center pt-4">
                <UButton
                  color="blue"
                  size="lg"
                  icon="i-heroicons-database-arrow-down"
                  label="Rellenar Nombres de Capítulos"
                  :loading="isUpdatingCapitulos"
                  :disabled="isUpdatingCapitulos || !isAdmin"
                  @click="populateCapituloTitles"
                >
                  <template
                    v-if="isUpdatingCapitulos"
                    #trailing
                  >
                    <UIcon
                      name="i-heroicons-arrow-path"
                      class="animate-spin"
                    />
                  </template>
                </UButton>
              </div>

              <!-- Results Display -->
              <div
                v-if="showUpdateResult && updateResult"
                class="space-y-4"
              >
                <div class="border-t pt-4">
                  <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Resultados de la Actualización
                  </h5>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div
                      class="text-center p-3 rounded-lg"
                      :class="updateResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'"
                    >
                      <div
                        class="text-2xl font-bold"
                        :class="updateResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                      >
                        {{ updateResult.updated }}
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400">
                        Actualizados
                      </div>
                    </div>

                    <div class="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div class="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {{ updateResult.skipped }}
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400">
                        Omitidos
                      </div>
                    </div>

                    <div
                      v-if="updateResult.errors && updateResult.errors.length > 0"
                      class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                    >
                      <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                        {{ updateResult.errors.length }}
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400">
                        Errores
                      </div>
                    </div>
                  </div>

                  <!-- Message -->
                  <div
                    class="p-3 rounded-lg text-sm"
                    :class="updateResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'"
                  >
                    {{ updateResult.message }}
                  </div>

                  <!-- Errors List -->
                  <div
                    v-if="updateResult.errors && updateResult.errors.length > 0"
                    class="mt-4"
                  >
                    <h6 class="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                      Errores encontrados:
                    </h6>
                    <div class="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                      <ul class="text-xs text-red-700 dark:text-red-300 space-y-1">
                        <li
                          v-for="(error, index) in updateResult.errors"
                          :key="index"
                          class="truncate"
                        >
                          • {{ error }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Additional Admin Tools (placeholder for future tools) -->
          <UCard class="opacity-60">
            <template #header>
              <div class="flex items-center space-x-2">
                <UIcon
                  name="i-heroicons-cog-6-tooth"
                  class="w-5 h-5 text-gray-400"
                />
                <h4 class="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Más Herramientas (Próximamente)
                </h4>
              </div>
            </template>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Se añadirán más herramientas de administración en el futuro
            </p>
          </UCard>
        </div>
      </UCard>
    </template>
  </UTabs>
</template>
