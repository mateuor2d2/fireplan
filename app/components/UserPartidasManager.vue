<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConceptoStore } from '@/stores/conceptos'
import { usePresupuestosStore } from '@/stores/presupuestos'
import { useUserStore } from '@/stores/user'
import type { MiniCapituloConceptos, MiniConcepto } from '@/stores/conceptos'
import type { ConceptodePresupuesto } from '@/stores/presupuestos'

// Store instances
const conceptosStore = useConceptoStore()
const presupuestosStore = usePresupuestosStore()
const userStore = useUserStore()

// Tab management
const activeTab = ref<'conceptos' | 'presupuestos'>('conceptos')

// Conceptos modal state
const showEditModal = ref(false)
const selectedConcepto = ref<MiniConcepto | null>(null)
const isEditMode = ref(false)

// Presupuestos modal state
const showPresupuestoModal = ref(false)
const selectedPresupuestoItem = ref<ConceptodePresupuesto | null>(null)
const isPresupuestoEditMode = ref(false)

// Loading states
const isLoading = ref(false)
const isLoadingPresupuestos = ref(false)

// Track expanded state for each capitulo
const expandedCapitulos = ref<Set<number>>(new Set())

// Toggle capitulo expansion
const toggleCapitulo = (capituloIndex: number) => {
  if (expandedCapitulos.value.has(capituloIndex)) {
    expandedCapitulos.value.delete(capituloIndex)
  } else {
    expandedCapitulos.value.add(capituloIndex)
  }
}

// Check if capitulo is expanded
const isCapituloExpanded = (capituloIndex: number) => {
  return expandedCapitulos.value.has(capituloIndex)
}

// Load user-specific conceptos
const loadUserConceptos = async () => {
  isLoading.value = true
  try {
    await conceptosStore.fetchMiniConceptos(userStore.user._id)
    await conceptosStore.getTreePartidasFull(userStore.user._id)
  } catch (error) {
    console.error('Error loading user conceptos:', error)
  } finally {
    isLoading.value = false
  }
}

// Load user presupuesto items
const loadUserPresupuestos = async () => {
  isLoadingPresupuestos.value = true
  try {
    await presupuestosStore.loadUserPresupuesto(userStore.user._id)
  } catch (error) {
    console.error('Error loading user presupuestos:', error)
  } finally {
    isLoadingPresupuestos.value = false
  }
}

// Initialize data
onMounted(async () => {
  await loadUserConceptos()
  await loadUserPresupuestos()
})

// Conceptos methods
const createConcepto = () => {
  selectedConcepto.value = null
  isEditMode.value = false
  showEditModal.value = true
}

const editConcepto = (concepto: MiniConcepto) => {
  selectedConcepto.value = concepto
  isEditMode.value = true
  showEditModal.value = true
}

const copyConcepto = (concepto: MiniConcepto) => {
  selectedConcepto.value = { ...concepto, id: undefined, nom_concepto: `${concepto.nom_concepto} (copia)` }
  isEditMode.value = false
  showEditModal.value = true
}

const deleteConcepto = async (concepto: MiniConcepto) => {
  if (!concepto.id) return

  const confirmed = confirm(`¿Estás seguro de que quieres eliminar "${concepto.nom_concepto}"?`)
  if (!confirmed) return

  try {
    await conceptosStore.deleteConcepto(concepto.id)
    await loadUserConceptos()

    toast.add({
      title: 'Éxito',
      description: 'Partida eliminada correctamente',
      color: 'success'
    })
  } catch (error) {
    console.error('Error deleting concepto:', error)
    toast.add({
      title: 'Error',
      description: 'Error al eliminar la partida',
      color: 'error'
    })
  }
}

// Presupuestos methods
const createPresupuestoItem = () => {
  selectedPresupuestoItem.value = null
  isPresupuestoEditMode.value = false
  showPresupuestoModal.value = true
}

const editPresupuestoItem = (item: ConceptodePresupuesto) => {
  selectedPresupuestoItem.value = item
  isPresupuestoEditMode.value = true
  showPresupuestoModal.value = true
}

const copyPresupuestoItem = (item: ConceptodePresupuesto) => {
  selectedPresupuestoItem.value = { ...item, id: null, concepto: `${item.concepto} (copia)` }
  isPresupuestoEditMode.value = false
  showPresupuestoModal.value = true
}

const deletePresupuestoItem = async (item: ConceptodePresupuesto) => {
  if (!item.id) return

  const confirmed = confirm(`¿Estás seguro de que quieres eliminar "${item.concepto}"?`)
  if (!confirmed) return

  try {
    await presupuestosStore.deleteUserPresupuestoItem(userStore.user._id, item.id)
    await loadUserPresupuestos()

    toast.add({
      title: 'Éxito',
      description: 'Ítem de presupuesto eliminado correctamente',
      color: 'success'
    })
  } catch (error) {
    console.error('Error deleting presupuesto item:', error)
    toast.add({
      title: 'Error',
      description: 'Error al eliminar el ítem de presupuesto',
      color: 'error'
    })
  }
}

// Handle saves
const onConceptoSaved = async () => {
  showEditModal.value = false
  await loadUserConceptos()

  toast.add({
    title: 'Éxito',
    description: isEditMode.value ? 'Partida actualizada correctamente' : 'Partida creada correctamente',
    color: 'success'
  })
}

const onPresupuestoItemSaved = async () => {
  showPresupuestoModal.value = false
  await loadUserPresupuestos()

  toast.add({
    title: 'Éxito',
    description: isPresupuestoEditMode.value ? 'Ítem actualizado correctamente' : 'Ítem creado correctamente',
    color: 'success'
  })
}

// Computed properties
const userPartidas = computed(() => {
  return conceptosStore.treeCapitulosPartidas.filter(capitulo =>
    capitulo.children && capitulo.children.some(concepto =>
      concepto.mguser === userStore.user._id
    )
  ).map(capitulo => ({
    ...capitulo,
    children: capitulo.children?.filter(concepto =>
      concepto.mguser === userStore.user._id
    ) || []
  }))
})

const userPresupuestoItems = computed(() => {
  return presupuestosStore.userPresupuesto
})

const presupuestoItemsByType = computed(() => {
  const grouped: Record<string, ConceptodePresupuesto[]> = {}
  userPresupuestoItems.value.forEach((item) => {
    if (!grouped[item.tipo]) {
      grouped[item.tipo] = []
    }
    grouped[item.tipo].push(item)
  })
  return grouped
})

// Helper functions
const hasUserPartidas = (capitulo: MiniCapituloConceptos) => {
  return capitulo.children?.some(concepto => concepto.mguser === userStore.user._id) || false
}

const getPartidasCount = (capitulo: MiniCapituloConceptos) => {
  return capitulo.children?.filter(concepto => concepto.mguser === userStore.user._id).length || 0
}

const getPresupuestoItemsCount = (tipo: string) => {
  return presupuestoItemsByType.value[tipo]?.length || 0
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Gestión de Partidas y Presupuestos
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Gestiona tus partidas de construcción e ítems de presupuesto personalizados
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <button
          :class="[
            activeTab === 'conceptos'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
          @click="activeTab = 'conceptos'"
        >
          Partidas de Construcción
        </button>
        <!-- <button @click="activeTab = 'presupuestos'" :class="[
          activeTab === 'presupuestos'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
          'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
        ]">
          Ítems de Presupuesto
        </button> -->
      </nav>
    </div>

    <!-- Conceptos Tab Content -->
    <div
      v-if="activeTab === 'conceptos'"
      class="space-y-6"
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Mis Partidas Personalizadas
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Gestiona tus partidas de construcción personalizadas para usar en tus planes de seguridad
          </p>
        </div>
        <UButton
          color="primary"
          icon="i-heroicons-plus"
          @click="createConcepto"
        >
          Nueva Partida
        </UButton>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-8"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-6 h-6 animate-spin"
        />
        <span class="ml-2">Cargando partidas...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="userPartidas.length === 0"
        class="text-center py-12"
      >
        <UIcon
          name="i-heroicons-list-bullet"
          class="text-4xl text-gray-400 mb-4"
        />
        <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No tienes partidas personalizadas
        </h4>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Crea tus primeras partidas de construcción personalizadas para tus planes de seguridad
        </p>
        <UButton
          color="primary"
          icon="i-heroicons-plus"
          @click="createConcepto"
        >
          Crear Primera Partida
        </UButton>
      </div>

      <!-- Partidas List -->
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="(capitulo, capituloIndex) in userPartidas"
          :key="capituloIndex"
          class="border rounded-lg overflow-hidden"
        >
          <!-- Capitulo Header -->
          <div
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="toggleCapitulo(capituloIndex)"
          >
            <div class="flex items-center gap-3">
              <UIcon
                :name="isCapituloExpanded(capituloIndex) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                class="w-5 h-5 text-gray-500"
              />
              <span class="font-medium text-gray-900 dark:text-white">
                {{ capitulo.name }}
              </span>
              <UBadge
                color="primary"
                variant="soft"
                size="sm"
              >
                {{ getPartidasCount(capitulo) }} partidas
              </UBadge>
            </div>
          </div>

          <!-- Partidas List -->
          <div
            v-if="isCapituloExpanded(capituloIndex)"
            class="border-t border-gray-200 dark:border-gray-700"
          >
            <div
              v-for="concepto in capitulo.children"
              :key="concepto.id"
              class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {{ concepto.nom_concepto }}
                </h4>
                <p
                  v-if="concepto.desc_concepto"
                  class="text-sm text-gray-600 dark:text-gray-400"
                >
                  {{ concepto.desc_concepto }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-pencil"
                  class="w-8 h-8"
                  @click="editConcepto(concepto)"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-document-duplicate"
                  class="w-8 h-8"
                  @click="copyConcepto(concepto)"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-trash"
                  class="w-8 h-8"
                  @click="deleteConcepto(concepto)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Presupuestos Tab Content -->
    <!--  -->

    <!-- Modals -->
    <ModalEditConcepto
      :model-value="showEditModal"
      :concepto="selectedConcepto"
      :is-edit="isEditMode"
      @update:model-value="showEditModal = $event"
      @saved="onConceptoSaved"
    />

    <!-- <ModalEditPresupuestoItem
      :model-value="showPresupuestoModal"
      @update:model-value="showPresupuestoModal = $event"
      :presupuesto-item="selectedPresupuestoItem"
      :is-edit="isPresupuestoEditMode"
      @saved="onPresupuestoItemSaved"
    /> -->
  </div>
</template>
