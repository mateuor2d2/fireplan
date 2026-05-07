<script setup lang="ts">
import type { Ref } from 'vue'
import type { MiniConcepto } from '~/stores/conceptos'
import type { MiniPlan } from '~/stores/planes'
import { useUserStore } from '~/stores/user'
import { usePlanesStore } from '~/stores/planes'
import { useConceptoStore } from '~/stores/conceptos'
import { useLoading } from '~/composables/useLoading'
import { LazyModalCopyElement } from '#components'

// Composable
const { withLoading } = useLoading()

// Router
const router = useRouter()
const route = useRoute()

// Overlay for programmatic modals
const overlay = useOverlay()

// Stores
const store = useUserStore()
const storePlanes = usePlanesStore()
const storeConceptos = useConceptoStore()

// Subscription
const { canCreatePlan } = useSubscription()

// Props
interface Props {
  title: string
  tipo: 'planes' | 'conceptos'
  url?: string
}

const props = withDefaults(defineProps<Props>(), {
  url: ''
})

// State
const page = ref(1)
const itemsPerPage = 5
const total = ref(0)
const items = ref<MiniPlan[] | MiniConcepto[]>([])
const openModalDelete = ref(false)
const loadingModalDelete = ref(false)
const idTemp = ref('')

// Search state
const searchTerm = ref('')
const showSearchOptions = ref(false)

// Sort state
const sortOption = ref('default')
const sortOptions = [
  { label: 'Sin ordenar', value: 'default' },
  { label: 'Pago (pendientes primero)', value: 'pending-first' },
  { label: 'Pago (pagados primero)', value: 'paid-first' },
  { label: 'Nombre A-Z', value: 'name-asc' },
  { label: 'Nombre Z-A', value: 'name-desc' }
]

const sortedItems = computed(() => {
  if (props.tipo !== 'planes' || sortOption.value === 'default') {
    return items.value
  }

  const sorted = [...items.value]
  switch (sortOption.value) {
    case 'pending-first':
      sorted.sort((a, b) => {
        const aPlan = a as MiniPlan
        const bPlan = b as MiniPlan
        return Number(aPlan.pagado) - Number(bPlan.pagado)
      })
      break
    case 'paid-first':
      sorted.sort((a, b) => {
        const aPlan = a as MiniPlan
        const bPlan = b as MiniPlan
        return Number(bPlan.pagado) - Number(aPlan.pagado)
      })
      break
    case 'name-asc':
      sorted.sort((a, b) => {
        const aPlan = a as MiniPlan
        const bPlan = b as MiniPlan
        return aPlan.nom_obra.localeCompare(bPlan.nom_obra)
      })
      break
    case 'name-desc':
      sorted.sort((a, b) => {
        const aPlan = a as MiniPlan
        const bPlan = b as MiniPlan
        return bPlan.nom_obra.localeCompare(aPlan.nom_obra)
      })
      break
  }
  return sorted
})

// Search field definitions
interface SearchField {
  label: string
  icon: string
  name: string
}

const searchFields = computed<SearchField[]>(() =>
  props.tipo === 'planes'
    ? [
        { label: 'Nombre Obra', name: 'nom_obra', icon: 'i-lucide-building' },
        { label: 'Dirección Obra', name: 'dir_obra', icon: 'i-lucide-map-pin' },
        { label: 'Nombre Contratista', name: 'nom_contratista', icon: 'i-lucide-user' }
      ]
    : [
        { label: 'Nombre Partida', name: 'nom_concepto', icon: 'i-heroicons-cube-solid' },
        { label: 'Capítulo', name: 'capitulo', icon: 'i-heroicons-rectangle-group-solid' }
      ]
)

// Initialize searchField with a default value
const defaultSearchField: SearchField = {
  label: 'nombre obra',
  name: 'nom_obra',
  icon: 'i-lucide-building'
}

const searchField = ref<SearchField>(defaultSearchField)

// Update searchField when searchFields changes
watch(searchFields, (newFields) => {
  if (newFields.length > 0) {
    searchField.value = newFields[0] || defaultSearchField
  }
}, { immediate: true })

// UI Helpers
const iconillo = computed(() =>
  props.tipo === 'planes' ? 'i-heroicons-book-open-solid' : 'i-heroicons-cube-solid'
)

const toWhere = computed(() =>
  props.tipo === 'planes' ? '/protected/planes/obra' : '/protected/conceptos/obra'
)

const links = computed(() => [
  {
    label: props.tipo,
    icon: iconillo.value
  }
  // {
  //   label: "Nuevo " + props.tipo,
  //   icon: "i-lucide-plus-circle",
  //   to: toWhere.value,
  // },
])

// searchField is now defined above with other refs

// Watchers
watch(page, async (newPage, oldPage) => {
  if (newPage !== oldPage && newPage > 0) {
    console.log('Page changed from', oldPage, 'to', newPage)
    await update()
  }
}, { immediate: false })

// Lifecycle hooks
onMounted(async () => {
  // Only initialize empty states - don't reset when coming back from editing
  await update()
})

// Methods
function getItemStyling(item: MiniPlan | MiniConcepto): string {
  const isAdminView = 'isAdminView' in item ? item.isAdminView : false
  const isOwner = 'isOwner' in item ? item.isOwner : true

  // Base styling
  let baseClasses = 'hover:bg-gray-50 dark:hover:bg-gray-800/50'

  // For planes
  if (props.tipo === 'planes') {
    if (isAdminView) {
      if (isOwner) {
        // Admin viewing their own plans
        baseClasses = 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-l-4 border-l-green-500'
      } else {
        // Admin viewing other users' plans
        baseClasses = 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-l-4 border-l-blue-500'
      }
    } else {
      // Regular user viewing their own plans
      baseClasses = 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
    }
  }

  // For conceptos
  if (props.tipo === 'conceptos') {
    const miniConcepto = item as MiniConcepto

    if (isAdminView) {
      // Admin viewing all conceptos
      if (isOwner) {
        // Admin viewing their own conceptos
        baseClasses = 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-l-4 border-l-green-500'
      } else {
        // Admin viewing other users' conceptos
        baseClasses = 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-l-4 border-l-blue-500'
      }
    } else {
      // Regular user viewing conceptos
      if (miniConcepto.isAdminConcepto) {
        // User viewing admin conceptos
        baseClasses = 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-l-4 border-l-purple-500'
      } else if (isOwner) {
        // User viewing their own conceptos
        baseClasses = 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
      } else {
        // User viewing other users' conceptos (shouldn't happen with current logic)
        baseClasses = 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-l-4 border-l-orange-500'
      }
    }
  }

  return baseClasses
}

function getBadgeInfo(item: MiniPlan | MiniConcepto) {
  const isAdminView = 'isAdminView' in item ? item.isAdminView : false
  const isOwner = 'isOwner' in item ? item.isOwner : true

  if (props.tipo === 'planes') {
    if (isAdminView) {
      if (isOwner) {
        return { text: 'Mi Plan', color: 'green', icon: 'i-lucide-user-check' }
      } else {
        return { text: 'Usuario', color: 'blue', icon: 'i-lucide-users' }
      }
    }
    return null // Regular users only see their own plans
  }

  if (props.tipo === 'conceptos') {
    const miniConcepto = item as MiniConcepto

    if (isAdminView) {
      if (isOwner) {
        return { text: 'Mi Concepto', color: 'green', icon: 'i-lucide-user-check' }
      } else {
        return { text: 'Usuario', color: 'blue', icon: 'i-lucide-users' }
      }
    } else {
      if (miniConcepto.isAdminConcepto) {
        return { text: 'Admin', color: 'purple', icon: 'i-lucide-shield-check' }
      } else if (isOwner) {
        return { text: 'Personal', color: 'gray', icon: 'i-lucide-user' }
      } else {
        return { text: 'Otro Usuario', color: 'orange', icon: 'i-lucide-user-minus' }
      }
    }
  }

  return null
}

async function update() {
  try {
    console.log('ElementBase update called, tipo:', props.tipo, 'page:', page.value)

    // Check if user is authenticated
    if (!store.user || !store.loggedIn) {
      console.warn('User not authenticated, skipping data fetch')
      items.value = []
      total.value = 0
      return
    }

    // Ensure searchField has a value
    if (!searchField.value) {
      console.warn('No search field selected')
      return
    }

    // Calculate pagination
    const currentPage = Math.max(1, page.value)
    const skipCount = (currentPage - 1) * itemsPerPage

    const params = {
      limit: itemsPerPage,
      skip: skipCount,
      ...(searchTerm.value && {
        search: searchTerm.value,
        searchField: searchField.value.name
      })
    }

    console.log('Fetching with params:', params)

    let response
    let totalCount = 0

    if (props.tipo === 'planes') {
      const result = await storePlanes.fetchMiniPlanes(params)
      console.log('Planes fetch result:', result)
      response = result?.data || []
      totalCount = result?.total || response.length
    } else {
      const result = await storeConceptos.fetchMiniConceptos(params)
      console.log('Conceptos fetch result:', result)
      response = result?.data || []
      totalCount = result?.total || response.length
    }

    console.log('Items to display:', response.length, 'Total count:', totalCount)
    items.value = Array.isArray(response) ? response : []
    total.value = totalCount

    // Reset page if it's beyond available items (avoid infinite recursion)
    if (items.value.length === 0 && currentPage > 1) {
      console.log('No items on current page, resetting to page 1')
      page.value = 1
      // Don't call update() again here to avoid infinite recursion
      // The watcher will handle the page change
      return
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    items.value = []
    total.value = 0
  }
}

// Search functions
async function performSearch() {
  // Check if user is authenticated before performing search
  if (!store.user || !store.loggedIn) {
    console.warn('User not authenticated, skipping search')
    return
  }

  if (page.value !== 1) {
    page.value = 1
  } else {
    // If already on page 1, just update the data
    console.log('Performing search:', searchTerm.value, 'in field:', searchField.value?.name)
    await update()
  }
}

// function toggleSearchOptions() {
//   showSearchOptions.value = !showSearchOptions.value;
// }

// function selectSearchField(field: SearchField) {
//   searchField.value = field;
//   showSearchOptions.value = false;
// }

// Element actions
async function elementEdit(id: string) {
  if (!id) return

  await withLoading(async () => {
    if (props.tipo === 'planes') {
      await storePlanes.loadPlanActual(id)
      await navigateTo(`/protected/planes/${id}/obra`)
    } else {
      const response = await storeConceptos.loadConceptoActual(id)
      if (response) {
        await navigateTo(`/protected/conceptos/${id}/obra`)
      }
    }
  })
}

function elementDelete(id: string) {
  if (!id) return
  openModalDelete.value = true
  idTemp.value = id
}

async function onDelete() {
  if (!idTemp.value) return

  loadingModalDelete.value = true
  try {
    if (props.tipo === 'planes') {
      await storePlanes.removePlan(idTemp.value)
    } else {
      // Need to find the index first for deleteConcepto
      const index = storeConceptos.conceptos.findIndex(c => c._id === idTemp.value)
      if (index !== -1) {
        await storeConceptos.deleteConcepto(index, idTemp.value)
      }
    }
    await update()
  } catch (error) {
    console.error('Error deleting item:', error)
  } finally {
    loadingModalDelete.value = false
    openModalDelete.value = false
    idTemp.value = ''
  }
}

// Copy functionality - using Nuxt UI v4 useOverlay pattern (as per documentation)
async function elementCopy(item: MiniPlan | MiniConcepto) {
  console.log('ElementBase - elementCopy called with item:', item)

  try {
    // Create modal instance using Lazy component - REQUIRED by Nuxt UI v4
    const modal = overlay.create(LazyModalCopyElement)
    console.log('ElementBase - modal created:', modal)

    // Open with props and await result - modal.open() returns a Promise
    // that resolves with the value passed to emit('close', value) in the modal
    const newName = await modal.open({
      item: item,
      tipo: props.tipo
    })
    console.log('ElementBase - modal closed with result:', newName)

    if (newName) {
      // User confirmed with a name
      await performCopy(item, newName)
    }
  } catch (error: any) {
    console.error('ElementBase - Error in elementCopy:', error)
  }
}

async function performCopy(item: MiniPlan | MiniConcepto, newName: string) {
  try {
    const toast = useToast()

    if (props.tipo === 'planes') {
      await storePlanes.copyPlan(item as MiniPlan, newName)
      toast.add({
        title: 'Plan copiado',
        description: `Se ha creado una copia: "${newName}"`,
        color: 'success'
      })
    } else {
      await storeConceptos.copyConceptoWithName(item as MiniConcepto, newName)
      toast.add({
        title: 'Concepto copiado',
        description: `Se ha creado una copia: "${newName}"`,
        color: 'success'
      })
    }

    await update()
  } catch (error: any) {
    console.error('Error copying item:', error)
    const toast = useToast()
    toast.add({
      title: 'Error al copiar',
      description: error.message || 'No se pudo copiar el elemento',
      color: 'error'
    })
  } finally {
    // Cleanup complete
  }
}

function goPage(pagelocal: number) {
  if (pagelocal !== page.value) {
    page.value = pagelocal
  }
}

function goToDashboard(itemId: string) {
  if (!itemId) {
    console.warn('Cannot navigate to dashboard: item ID is undefined')
    return
  }

  // Only navigate to dashboard for planes (not conceptos)
  if (props.tipo === 'planes') {
    // Navigate to plan dashboard for issues
    navigateTo(`/protected/planes/${itemId}/dashboard`)
  } else {
    console.warn('Dashboard navigation is only available for planes, not conceptos')
  }
}

function goToIssues(itemId: string) {
  if (!itemId) {
    console.warn('Cannot navigate to issues: item ID is undefined')
    return
  }

  // Only navigate to issues for planes (not conceptos)
  if (props.tipo === 'planes') {
    // Navigate to plan issues page
    navigateTo(`/protected/planes/${itemId}/issues`)
  } else {
    console.warn('Issues navigation is only available for planes, not conceptos')
  }
}

function goToInstrucciones(itemId: string) {
  if (!itemId) {
    console.warn('Cannot navigate to instrucciones: item ID is undefined')
    return
  }

  // Only navigate to instrucciones for planes (not conceptos)
  if (props.tipo === 'planes') {
    navigateTo(`/protected/planes/${itemId}/instrucciones`)
  } else {
    console.warn('Instrucciones navigation is only available for planes, not conceptos')
  }
}

async function createNewPlan() {
  if (props.tipo === 'planes') {
    // Admin bypass - allow creating unlimited plans
    if (store.user?.role !== 'admin' && !canCreatePlan(total.value)) {
      const toast = useToast()
      toast.add({
        title: 'Límite alcanzado',
        description: 'Tu plan actual no permite más planes de seguridad. Actualiza tu suscripción.',
        color: 'warning'
      })
      return navigateTo('/pricing')
    }
    // Reset the planes store to clear any existing plan data
    await storePlanes.initPlanActual()
    await navigateTo('/protected/planes/obra')
  } else {
    // Reset the conceptos store to clear any existing concepto data
    await storeConceptos.SET_CONCEPTO_ACTUAL_INI()
    await navigateTo('/protected/conceptos/obra')
  }
}
</script>

<template>
  <UModal
    v-model:open="openModalDelete"
    title="Borrar elemento"
    :description="`¿Seguro que quieres borrar este ${tipo}?`"
    :ui="{
      footer: 'ml-16'
    }"
  >
    <template #icon>
      <UIcon
        name="i-lucide-alert-circle"
        class="w-6 h-6 text-red-500"
      />
    </template>
    <template #footer>
      <UButton
        color="error"
        :loading="loadingModalDelete"
        @click="onDelete"
      >
        Eliminar
      </UButton>
      <UButton
        color="neutral"
        variant="ghost"
        label="Cancelar"
        @click="openModalDelete = false"
      />
    </template>
  </UModal>
  <UCard>
    <template #header>
      <UNavigationMenu
        :items="links"
        class="border-b border-gray-200 dark:border-gray-800"
      />

      <!-- Legend for visual indicators -->
      <div
        v-if="store.user?.role === 'admin'"
        class="mb-3 flex flex-wrap gap-2 text-xs"
      >
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-green-500 rounded-sm" />
          <span>Mis {{ props.tipo }}</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-blue-500 rounded-sm" />
          <span>Otros usuarios</span>
        </div>
        <div
          v-if="props.tipo === 'planes'"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-heroicons-clipboard-document-check"
            class="w-3 h-3 text-primary-500"
          />
          <span>Instrucciones de obra: gestiona y da instrucciones de seguridad a los trabajadores</span>
        </div>
      </div>
      <div
        v-else
        class="mb-3 flex flex-wrap gap-2 text-xs"
      >
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-purple-500 rounded-sm" />
          <span>Admin (compartido)</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-gray-500 rounded-sm" />
          <span>Personal</span>
        </div>
        <div
          v-if="props.tipo === 'planes'"
          class="flex items-center gap-1"
        >
          <UIcon
            name="i-heroicons-clipboard-document-check"
            class="w-3 h-3 text-primary-500"
          />
          <span>Instrucciones de obra: gestiona y da instrucciones de seguridad a los trabajadores</span>
        </div>
      </div>

      <div class="mb-4 flex items-center space-x-2">
        <UInput
          v-model="searchTerm"
          placeholder="Search..."
          icon="i-lucide-search"
          class="flex-grow"
          @keyup.enter="performSearch"
        />
        <USelectMenu
          v-model="searchField"
          selected-icon="i-lucide-thumbs-up"
          class="w-1/3"
          placeholder="Select a kind of search"
          :items="searchFields"
        >
          <template #leading>
            <UIcon
              v-if="searchField.icon"
              :name="(searchField.icon as string)"
              class="w-5 h-5"
            />
            <UIcon
              v-else
              name="i-lucide-search"
              class="w-5 h-5"
            />
          </template>
        </USelectMenu>
        <UButton
          icon="i-lucide-search"
          color="primary"
          class="mr-2"
          @click="performSearch"
        >
          Search
        </UButton>
        <UButton
          icon="i-lucide-plus"
          color="secondary"
          :label="'New ' + props.tipo"
          class="whitespace-nowrap"
          :disabled="props.tipo === 'planes' && store.user?.role !== 'admin' && !canCreatePlan(total.value)"
          @click="createNewPlan"
        />
      </div>

      <!-- Sort control for planes -->
      <div
        v-if="props.tipo === 'planes'"
        class="mb-4 flex items-center gap-2"
      >
        <UIcon
          name="i-lucide-arrow-up-down"
          class="w-4 h-4 text-gray-400"
        />
        <USelect
          v-model="sortOption"
          :items="sortOptions"
          placeholder="Ordenar por..."
          class="w-64"
          size="sm"
        />
      </div>
    </template>

    <div
      v-for="(item, index) in sortedItems"
      :key="index"
      :class="[
        'px-3 py-2 -mx-2 last:-mb-2 rounded-md flex items-center gap-3 relative transition-all duration-200',
        getItemStyling(item)
      ]"
    >
      <UIcon :name="iconillo" />

      <div
        class="text-sm flex-1 cursor-pointer"
        @click="elementEdit((item as MiniPlan)._id)"
      >
        <div v-if="props.tipo === 'planes'">
          <div class="flex items-center justify-between gap-2">
            <p class="text-gray-900 dark:text-white font-medium break-words">
              {{ (item as MiniPlan).nom_obra }}
            </p>
            <div class="flex items-center gap-1 flex-shrink-0">
              <UBadge
                v-if="getBadgeInfo(item)"
                :color="getBadgeInfo(item)?.color as any"
                variant="subtle"
                size="xs"
              >
                <UIcon
                  v-if="getBadgeInfo(item)?.icon"
                  :name="getBadgeInfo(item)?.icon as string"
                  class="w-3 h-3 mr-1"
                />
                {{ getBadgeInfo(item)?.text }}
              </UBadge>
              <UBadge
                :color="(item as MiniPlan).pagado ? 'success' : 'error'"
                variant="subtle"
                size="xs"
              >
                <UIcon
                  :name="(item as MiniPlan).pagado ? 'i-lucide-check-circle' : 'i-lucide-clock'"
                  class="w-3 h-3 mr-1"
                />
                {{ (item as MiniPlan).pagado ? 'Pagado' : 'Pendiente' }}
              </UBadge>
            </div>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm break-words">
            {{ (item as MiniPlan).dir_obra }}
          </p>
          <p class="text-gray-500 dark:text-gray-400 text-sm break-words">
            {{ (item as MiniPlan).nom_contratista }}
          </p>
          <p
            v-if="(item as MiniPlan).isAdminView && !(item as MiniPlan).isOwner"
            class="text-xs text-blue-600 dark:text-blue-400 mt-1"
          >
            <UIcon
              name="i-lucide-user"
              class="w-3 h-3 inline mr-1"
            />
            Propietario: <span class="font-medium">{{ (item as MiniPlan).ownerName }}</span>
            <span
              v-if="(item as MiniPlan).ownerEmail"
              class="text-gray-400"
            >({{ (item as MiniPlan).ownerEmail
            }})</span>
          </p>
        </div>
        <div v-if="props.tipo === 'conceptos'">
          <div class="flex items-center justify-between gap-2">
            <p class="text-gray-900 dark:text-white font-medium break-words">
              {{ (item as MiniConcepto).nom_concepto }}
            </p>
            <UBadge
              v-if="getBadgeInfo(item)"
              :color="getBadgeInfo(item)?.color as any"
              variant="subtle"
              size="xs"
              class="flex-shrink-0"
            >
              <UIcon
                v-if="getBadgeInfo(item)?.icon"
                :name="getBadgeInfo(item)?.icon as string"
                class="w-3 h-3 mr-1"
              />
              {{ getBadgeInfo(item)?.text }}
            </UBadge>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm overflow-hidden text-ellipsis line-clamp-2">
            {{ (item as MiniConcepto).desc_concepto }}
          </p>
          <p
            v-if="(item as MiniConcepto).isAdminView && !(item as MiniConcepto).isOwner"
            class="text-xs text-blue-600 dark:text-blue-400 mt-1"
          >
            <UIcon
              name="i-lucide-user"
              class="w-3 h-3 inline mr-1"
            />
            Propietario: <span class="font-medium">{{ (item as MiniConcepto).ownerName }}</span>
            <span
              v-if="(item as MiniConcepto).ownerEmail"
              class="text-gray-400"
            >({{ (item as MiniConcepto).ownerEmail
            }})</span>
          </p>
        </div>
      </div>
      <UPopover mode="hover">
        <UButton
          icon="i-lucide-edit"
          size="sm"
          color="primary"
          square
          variant="solid"
          @click.stop="elementEdit((item as any)._id)"
        />
        <template #panel>
          <div class="p-1 text-xs">
            Editar
          </div>
        </template>
      </UPopover>
      <!-- Copy button for both planes and conceptos -->
      <UPopover mode="hover">
        <UButton
          icon="i-lucide-copy"
          size="sm"
          color="secondary"
          square
          variant="soft"
          @click.stop="elementCopy(item)"
        />
        <template #panel>
          <div class="p-1 text-xs">
            Copiar
          </div>
        </template>
      </UPopover>
      <!-- Only show dashboard icon for planes (not conceptos) -->
      <UPopover
        v-if="props.tipo === 'planes'"
        mode="hover"
      >
        <UButton
          icon="i-heroicons-squares-2x2"
          size="sm"
          color="warning"
          square
          variant="ghost"
          @click.stop="goToDashboard((item as any)._id)"
        />
        <template #panel>
          <div class="p-1 text-xs">
            Dashboard de Incidencias
          </div>
        </template>
      </UPopover>
      <!-- Only show issues icon for planes (not conceptos) -->
      <UPopover
        v-if="props.tipo === 'planes'"
        mode="hover"
      >
        <UButton
          icon="i-heroicons-flag"
          size="sm"
          color="error"
          square
          variant="solid"
          @click.stop="goToIssues((item as any)._id)"
        />
        <template #panel>
          <div class="p-1 text-xs">
            Incidencias
          </div>
        </template>
      </UPopover>
      <!-- Instrucciones de obra -->
      <UPopover
        v-if="props.tipo === 'planes'"
        mode="hover"
      >
        <UTooltip
          text="Instrucciones de obra: gestiona y da instrucciones de seguridad a los trabajadores"
          :popper="{ placement: 'top' }"
        >
          <UButton
            icon="i-heroicons-clipboard-document-check"
            size="sm"
            color="primary"
            square
            variant="soft"
            @click.stop="goToInstrucciones((item as any)._id)"
          />
        </UTooltip>
        <template #panel>
          <div class="p-2 text-xs max-w-xs">
              <strong>Instrucciones de Obra</strong><br>
              Gestiona y da instrucciones de seguridad a los trabajadores de esta obra
        </div>
        </template>
      </UPopover>
      <UPopover mode="hover">
        <UButton
          color="error"
          icon="i-heroicons-trash"
          variant="ghost"
          @click="elementDelete((item as any)._id)"
        />
        <template #panel>
          <div class="p-1 text-xs">
            Borrar
          </div>
        </template>
      </UPopover>
    </div>

    <template #footer>
      <div class="flex justify-center mt-4">
        <UPagination
          v-model:page="page"
          :page-count="itemsPerPage"
          :total="total"
          :disabled="items.length === 0 || total === 0"
          :max="7"
          show-last
          show-first
        />
      </div>
    </template>
  </UCard>
</template>
