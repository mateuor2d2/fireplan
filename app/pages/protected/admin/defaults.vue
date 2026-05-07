<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Administración de Valores por Defecto
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gestiona los valores por defecto que se aplicarán a todos los usuarios de la aplicación
      </p>
    </div>

    <!-- Admin Check -->
    <div
      v-if="!userStore.isAdmin"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
    >
      <div class="flex items-center space-x-3">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="text-red-500 text-xl"
        />
        <div>
          <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
            Acceso Restringido
          </h3>
          <p class="text-red-700 dark:text-red-300 mt-1">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    </div>

    <!-- Admin Interface -->
    <div v-else>
      <UTabs
        :items="tabs"
        class="w-full"
      >
        <!-- Capítulos por Defecto -->
        <template #capitulos="{ item }">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ item.label }}
                </h3>
                <UBadge
                  color="blue"
                  variant="soft"
                >
                  {{ defaultCapitulos.length }} elementos
                </UBadge>
              </div>
            </template>

            <div class="space-y-6">
              <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="text-blue-500 mt-0.5"
                  />
                  <div class="text-sm text-blue-700 dark:text-blue-300">
                    <p class="font-medium mb-1">
                      Información
                    </p>
                    <p>Estos capítulos se usarán como valores por defecto para todos los usuarios que no tengan capítulos personalizados.</p>
                  </div>
                </div>
              </div>

              <!-- Capítulos Table -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <UTable
                  :rows="defaultCapitulos"
                  :columns="capitulosColumns"
                  :loading="isLoadingCapitulos"
                  :empty-state="{ icon: 'i-heroicons-folder', label: 'No hay capítulos por defecto' }"
                >
                  <template #actions-data="{ row }">
                    <div class="flex items-center space-x-2">
                      <UButton
                        icon="i-heroicons-pencil"
                        size="sm"
                        color="gray"
                        variant="ghost"
                        @click="editCapitulo(row)"
                      />
                      <UButton
                        icon="i-heroicons-trash"
                        size="sm"
                        color="red"
                        variant="ghost"
                        @click="deleteCapitulo(row)"
                      />
                    </div>
                  </template>
                </UTable>
              </div>

              <!-- Add Capítulo Button -->
              <div class="flex justify-end">
                <UButton
                  icon="i-heroicons-plus"
                  label="Agregar Capítulo"
                  @click="addCapitulo"
                />
              </div>
            </div>
          </UCard>
        </template>

        <!-- Presupuesto por Defecto -->
        <template #presupuesto="{ item }">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ item.label }}
                </h3>
                <UBadge
                  color="green"
                  variant="soft"
                >
                  {{ defaultPresupuesto.length }} conceptos
                </UBadge>
              </div>
            </template>

            <div class="space-y-6">
              <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                  <UIcon
                    name="i-heroicons-information-circle"
                    class="text-green-500 mt-0.5"
                  />
                  <div class="text-sm text-green-700 dark:text-green-300">
                    <p class="font-medium mb-1">
                      Información
                    </p>
                    <p>Estos conceptos de presupuesto se usarán como valores por defecto para todos los usuarios y planes nuevos.</p>
                  </div>
                </div>
              </div>

              <!-- Presupuesto Table -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <UTable
                  :rows="defaultPresupuesto"
                  :columns="presupuestoColumns"
                  :loading="isLoadingPresupuesto"
                  :empty-state="{ icon: 'i-heroicons-currency-euro', label: 'No hay conceptos de presupuesto por defecto' }"
                >
                  <template #tipo-data="{ row }">
                    <UBadge
                      :color="getTipoColor(row.tipo)"
                      variant="soft"
                      size="sm"
                    >
                      {{ row.tipo }}
                    </UBadge>
                  </template>

                  <template #precioud-data="{ row }">
                    <span class="font-mono">{{ formatCurrency(row.precioud) }}</span>
                  </template>

                  <template #total-data="{ row }">
                    <span class="font-mono font-semibold">{{ formatCurrency(row.total) }}</span>
                  </template>

                  <template #actions-data="{ row }">
                    <div class="flex items-center space-x-2">
                      <UButton
                        icon="i-heroicons-pencil"
                        size="sm"
                        color="gray"
                        variant="ghost"
                        @click="editPresupuesto(row)"
                      />
                      <UButton
                        icon="i-heroicons-trash"
                        size="sm"
                        color="red"
                        variant="ghost"
                        @click="deletePresupuesto(row)"
                      />
                    </div>
                  </template>
                </UTable>
              </div>

              <!-- Add Presupuesto Button -->
              <div class="flex justify-end space-x-3">
                <UButton
                  icon="i-heroicons-arrow-path"
                  label="Restaurar Valores Originales"
                  color="gray"
                  variant="soft"
                  @click="resetPresupuestoDefaults"
                />
                <UButton
                  icon="i-heroicons-plus"
                  label="Agregar Concepto"
                  @click="addPresupuesto"
                />
              </div>
            </div>
          </UCard>
        </template>

        <!-- Configuración General -->
        <template #config="{ item }">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ item.label }}
              </h3>
            </template>

            <div class="space-y-6">
              <div class="space-y-4">
                <h4 class="text-base font-medium text-gray-900 dark:text-white">
                  Configuración de Valores por Defecto
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Auto-apply defaults -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                          Aplicar automáticamente valores por defecto
                        </h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Los nuevos usuarios recibirán automáticamente los valores por defecto
                        </p>
                      </div>
                      <USwitch v-model="adminConfig.autoApplyDefaults" />
                    </div>
                  </div>

                  <!-- Allow user customization -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <h5 class="text-sm font-medium text-gray-900 dark:text-white">
                          Permitir personalización de usuarios
                        </h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Los usuarios pueden modificar sus valores por defecto
                        </p>
                      </div>
                      <USwitch v-model="adminConfig.allowUserCustomization" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Save Configuration -->
              <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <UButton
                  icon="i-heroicons-check"
                  label="Guardar Configuración"
                  :loading="isSavingConfig"
                  @click="saveAdminConfig"
                />
              </div>
            </div>
          </UCard>
        </template>

        <!-- Precios Tab -->
        <template #pricing="{ item }">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ item.label }}
                </h3>
                <NuxtLink
                  to="/protected/admin/pricing"
                  class="text-blue-500 hover:text-blue-600 text-sm"
                >
                  Configurar precios
                </NuxtLink>
              </div>
            </template>

            <div class="space-y-6">
              <div class="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div class="flex items-center space-x-4">
                  <UIcon
                    name="i-heroicons-currency-euro"
                    class="text-blue-500 dark:text-blue-400 text-4xl"
                  />
                  <div>
                    <h4 class="text-xl font-bold text-blue-900 dark:text-blue-200">
                      Configuración de Precios
                    </h4>
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                      Gestiona el precio del Plan y la personalización por unidad
                    </p>
                  </div>
                </div>

                <div class="space-y-4">
                  <h5 class="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Precios Configurados
                  </h5>
                  <UAlert
                    icon="i-heroicons-check-circle"
                    color="green"
                    variant="soft"
                    class="mb-4"
                  >
                    <p class="text-sm text-green-700 dark:text-green-300">
                      El precio actual del Plan de Seguridad es <strong>€29.00</strong>
                    </p>
                    <p class="text-sm text-green-700 dark:text-green-300">
                      El precio por defecto de personalización es <strong>€0.99</strong> por unidad
                    </p>
                  </UAlert>

                  <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h6 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
                      Para Cambiar los Precios
                    </h6>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Como administrador, puedes modificar los precios del sistema desde la página de configuración de precios.
                    </p>
                    <UButton
                      to="/protected/admin/pricing"
                      icon="i-heroicons-currency-euro"
                      label="Ir a Configuración de Precios"
                      size="lg"
                      color="blue"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ucard>
        </template>
      </UTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConceptodePresupuesto } from '~/stores/presupuestos'

// Meta and middleware
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Stores
const userStore = useUserStore()
const masterTablesStore = useMasterTablesStore()
const presupuestosStore = usePresupuestosStore()

// Reactive state
const isLoadingCapitulos = ref(false)
const isLoadingPresupuesto = ref(false)
const isSavingConfig = ref(false)

const defaultCapitulos = ref<any[]>([])
const defaultPresupuesto = ref<ConceptodePresupuesto[]>([])

const adminConfig = ref({
  autoApplyDefaults: true,
  allowUserCustomization: true
})

// Tabs configuration
const tabs = [
  {
    key: 'capitulos',
    label: 'Capítulos por Defecto',
    icon: 'i-heroicons-folder'
  },
  {
    key: 'presupuesto',
    label: 'Presupuesto por Defecto',
    icon: 'i-heroicons-currency-euro'
  },
  {
    key: 'config',
    label: 'Configuración General',
    icon: 'i-heroicons-cog-6-tooth'
  },
  {
    key: 'pricing',
    label: 'Precios',
    icon: 'i-heroicons-currency-euro'
  }
]

// Table columns
const capitulosColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'description', label: 'Descripción', sortable: true },
  { key: 'isActive', label: 'Activo', sortable: true },
  { key: 'actions', label: 'Acciones' }
]

const presupuestoColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'concepto', label: 'Concepto', sortable: true },
  { key: 'tipo', label: 'Tipo', sortable: true },
  { key: 'ud', label: 'Ud.', sortable: true },
  { key: 'precioud', label: 'Precio/Ud.', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'actions', label: 'Acciones' }
]

// Methods
const loadDefaultCapitulos = async () => {
  isLoadingCapitulos.value = true
  try {
    await masterTablesStore.loadTables('capitulo')
    defaultCapitulos.value = masterTablesStore.defaultTables.capitulo || []
  } catch (error) {
    console.error('Error loading default capitulos:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al cargar los capítulos por defecto',
      color: 'red'
    })
  } finally {
    isLoadingCapitulos.value = false
  }
}

const loadDefaultPresupuesto = async () => {
  isLoadingPresupuesto.value = true
  try {
    // Load default presupuesto from API or initialize with hardcoded values
    const { data } = await $fetch('/api/admin/presupuesto-defaults')
    if (data && data.length > 0) {
      defaultPresupuesto.value = data
    } else {
      // Initialize with current hardcoded defaults
      presupuestosStore.inicializaPresupuesto()
      defaultPresupuesto.value = [...presupuestosStore.presupuesto]
    }
  } catch (error) {
    console.error('Error loading default presupuesto:', error)
    // Fallback to hardcoded defaults
    presupuestosStore.inicializaPresupuesto()
    defaultPresupuesto.value = [...presupuestosStore.presupuesto]
  } finally {
    isLoadingPresupuesto.value = false
  }
}

const getTipoColor = (tipo: string) => {
  const colors: Record<string, string> = {
    'Protecciones Personales': 'blue',
    'Protecciones Colectivas': 'green',
    'Señalizaciones': 'yellow',
    'Medicina Preventiva': 'red',
    'Instalaciones para el personal': 'purple',
    'Extinción de incendios': 'orange',
    'Primeros auxilios': 'pink',
    'Formación y reuniones de obligado cumplimiento': 'indigo'
  }
  return colors[tipo] || 'gray'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

// CRUD operations for Capítulos
const addCapitulo = () => {
  // TODO: Implement add capitulo modal
  console.log('Add capitulo')
}

const editCapitulo = (capitulo: any) => {
  // TODO: Implement edit capitulo modal
  console.log('Edit capitulo:', capitulo)
}

const deleteCapitulo = async (capitulo: any) => {
  // TODO: Implement delete capitulo
  console.log('Delete capitulo:', capitulo)
}

// CRUD operations for Presupuesto
const addPresupuesto = () => {
  // TODO: Implement add presupuesto modal
  console.log('Add presupuesto')
}

const editPresupuesto = (concepto: ConceptodePresupuesto) => {
  // TODO: Implement edit presupuesto modal
  console.log('Edit presupuesto:', concepto)
}

const deletePresupuesto = async (concepto: ConceptodePresupuesto) => {
  // TODO: Implement delete presupuesto
  console.log('Delete presupuesto:', concepto)
}

const resetPresupuestoDefaults = async () => {
  // TODO: Implement reset to original hardcoded defaults
  console.log('Reset presupuesto defaults')
}

const saveAdminConfig = async () => {
  isSavingConfig.value = true
  try {
    // TODO: Save admin configuration
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

    const toast = useToast()
    toast.add({
      title: 'Éxito',
      description: 'Configuración guardada correctamente',
      color: 'green'
    })
  } catch (error) {
    console.error('Error saving admin config:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al guardar la configuración',
      color: 'red'
    })
  } finally {
    isSavingConfig.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (userStore.isAdmin) {
    await Promise.all([
      loadDefaultCapitulos(),
      loadDefaultPresupuesto()
    ])
  }
})
</script>
