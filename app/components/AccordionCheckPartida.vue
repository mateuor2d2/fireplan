<script setup lang="ts">
import { computed, onMounted, watchEffect, ref } from 'vue'
import type { TreeItem } from '@nuxt/ui'
import { useConceptoStore } from '@/stores/conceptos'
import { usePlanesStore } from '@/stores/planes'
import { useUserStore } from '@/stores/user'
import type { MiniCapituloConceptos, MiniConcepto } from '@/stores/conceptos'
// import { useCheckboxModel } from '~/composables/useCheckBoxPartida'

const conceptosStore = useConceptoStore()
const planStore = usePlanesStore()
const userStore = useUserStore()

// Toggle for filtering conceptos
// For admin: false = own only (DEFAULT), true = own + all users
// For regular users: false = own + admin (DEFAULT), true = own only
// Initialize based on user role - admin starts with toggle OFF to see only own conceptos by default
const showOnlyOwnConceptos = ref(userStore.user?.role === 'admin' ? false : false)

// Modal state
const showEditModal = ref(false)
const selectedConcepto = ref<MiniConcepto | null>(null)
const isEditMode = ref(false)

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

// Progress tracking state
const isLoadingWithProgress = ref(false)
const currentProgressStep = ref('')

// Progress callback function
const onProgress = (step: string) => {
  currentProgressStep.value = step
  console.log('Progress step:', step)
}

// Load tree data function
const loadTreeData = async (forceReload = false) => {
  const planId = planStore.planActual?._id

  console.log('🔍 AccordionCheckPartida loading tree data for plan:', planId)
  console.log('🔍 Plan treePartidas length:', planStore.planActual?.treePartidas?.length || 0)
  console.log('🔍 Plan partidas length:', planStore.planActual?.partidas?.length || 0)
  console.log('🔍 Plan userPartidas length:', planStore.planActual?.userPartidas?.length || 0)

  // Always force reload when plan ID changes or if no tree data exists
  const needsLoading = !planId || conceptosStore.treeCapitulosPartidas.length === 0 || forceReload

  if (needsLoading) {
    console.log('Loading tree data for plan:', planId, 'showOnlyOwn:', showOnlyOwnConceptos.value)

    // Clear cache to force fresh data load
    conceptosStore.clearMasterTablesCache()

    isLoadingWithProgress.value = true
    currentProgressStep.value = 'checking'

    try {
      // Use plan-specific loading logic that respects user settings with progress tracking
      // For admin: showOnlyOwnConceptos.value = false means show only own (default) - "Ver solo mis conceptos"
      // For admin: showOnlyOwnConceptos.value = true means show all users - "Ver todos los usuarios"
      // For regular users: showOnlyOwnConceptos.value = false means show own + admin (default) - "Ver mis conceptos + admin"
      // For regular users: showOnlyOwnConceptos.value = true means show only own - "Ver solo mis conceptos"

      const isAdmin = userStore.user?.role === 'admin'
      let shouldShowOnlyOwn = showOnlyOwnConceptos.value

      // For admin users, we need to invert the logic:
      // - Toggle OFF (false) = Show only own conceptos = shouldShowOnlyOwn = true
      // - Toggle ON (true) = Show all users' conceptos = shouldShowOnlyOwn = false
      if (isAdmin) {
        shouldShowOnlyOwn = !showOnlyOwnConceptos.value
      }

      console.log('DEBUG: showOnlyOwnConceptos.value:', showOnlyOwnConceptos.value)
      console.log('DEBUG: isAdmin:', isAdmin)
      console.log('DEBUG: shouldShowOnlyOwn (after logic):', shouldShowOnlyOwn)

      const treeData = await conceptosStore.getTreePartidasForPlan(planId, onProgress, shouldShowOnlyOwn)
      if (treeData) {
        conceptosStore.SET_TREE_PARTIDAS_FULL(treeData.filter(item => item !== null))
        console.log('Tree data loaded for plan:', planId, 'items:', treeData.length)

        // Debug: Check if capitulos have children
        treeData.forEach((capitulo, index) => {
          console.log(`Capitulo ${index + 1}: ${capitulo?.name || 'Unknown'} - Children: ${capitulo?.children?.length || 0}`)
          if (capitulo?.children && capitulo.children.length > 0) {
            console.log(`First child: ${capitulo.children[0]?.nom_concepto || 'No name'}`)
          }
        })
      }
    } catch (error) {
      console.error('Error loading tree data:', error)

      // Show user-friendly error message
      const toast = useToast()
      toast.add({
        title: 'Error cargando capitulos',
        description: error instanceof Error ? error.message : 'Error desconocido al cargar los datos',
        color: 'error'
      })

      // Clear the tree data so user sees empty state instead of stale data
      conceptosStore.SET_TREE_PARTIDAS_FULL([])
    } finally {
      isLoadingWithProgress.value = false
      currentProgressStep.value = ''
    }
  } else {
    console.log('Tree data already loaded, skipping reload')
    // Even if we're not reloading, let's log the current tree data
    console.log('Current treeCapitulosPartidas:', conceptosStore.treeCapitulosPartidas)
    console.log('Current plan treePartidas:', planStore.planActual?.treePartidas)
  }
}

// Watch for changes in the toggle
watch(showOnlyOwnConceptos, async (newValue) => {
  console.log('Toggle changed to:', newValue)
  // Reload tree data when toggle changes
  await loadTreeData(true)
})

// Watch for plan ID changes to reload tree data
watch(() => planStore.planActual?._id, async (newPlanId, oldPlanId) => {
  if (newPlanId !== oldPlanId) {
    console.log('Plan ID changed from', oldPlanId, 'to', newPlanId)
    // Force reload tree data when plan changes
    await loadTreeData(true)
  }
})

// Initialize data when component mounts
onMounted(async () => {
  console.log('AccordionCheckPartida mounted, checking data...')
  console.log('User role:', userStore.user?.role)
  console.log('Current treeCapitulosPartidas:', conceptosStore.treeCapitulosPartidas)
  await loadTreeData()

  // Auto-expand all capitulos after data loads
  watchEffect(() => {
    if (conceptosStore.treeCapitulosPartidas.length > 0) {
      conceptosStore.treeCapitulosPartidas.forEach((_, index) => {
        expandedCapitulos.value.add(index)
      })
    }
  })
})

// Create a reactive computed property for treePartidas
const treePartidasComputed = computed(() => planStore.planActual?.treePartidas || [])

// Check if a concepto is selected
const isConceptoSelected = (concepto: MiniConcepto, capituloIndex: number): boolean => {
  const treePartidas = treePartidasComputed.value

  if (!Array.isArray(treePartidas)) {
    console.log('🔍 isConceptoSelected: treePartidas is not an array', treePartidas)
    return false
  }

  // Ensure the capitulo index exists and has children
  if (!treePartidas[capituloIndex]) {
    console.log(`🔍 isConceptoSelected: capituloIndex ${capituloIndex} not found in treePartidas`)
    return false
  }

  const currentTreePartidas = treePartidas[capituloIndex]?.children || []
  const conceptoName = concepto.nom_concepto

  // Check if the concepto exists in the treePartidas
  // The name could be stored as either 'name' or 'nom_concepto' in the treePartidas
  const isSelected = currentTreePartidas.some((partida: { name?: string, nom_concepto?: string }) => {
    const partidaName = partida.name || partida.nom_concepto
    return partidaName === conceptoName
  })

  // Enhanced debug logging for better troubleshooting
  if (conceptoName.includes('Demoliciones') || Math.random() < 0.05) { // Log specific conceptos + 5% random
    console.log('🔍 isConceptoSelected check:', {
      conceptoName,
      capituloIndex,
      currentTreePartidasLength: currentTreePartidas.length,
      isSelected,
      treePartidasTotal: treePartidas?.length || 0,
      firstPartidaName: currentTreePartidas[0]?.name || currentTreePartidas[0]?.nom_concepto,
      currentTreePartidasSample: currentTreePartidas.slice(0, 3).map((p: { name?: string, nom_concepto?: string, id?: string }) => ({
        name: p.name,
        nom_concepto: p.nom_concepto,
        id: p.id
      })),
      treePartidasStructure: treePartidas.map((cap: { name?: string, children?: Array<unknown> }, idx: number) => ({
        index: idx,
        name: cap.name,
        childrenCount: cap.children?.length || 0
      }))
    })
  }

  return isSelected
}

// Toggle concepto selection
const toggleConcepto = async (concepto: MiniConcepto, capituloIndex: number, value: boolean | 'indeterminate') => {
  const boolValue = value === true
  console.log('Toggling concepto:', concepto.nom_concepto, 'to:', value)

  // Get current treePartidas and ensure it's initialized
  const currentTreePartidas = planStore.planActual?.treePartidas || []

  // Create a deep copy to work with, but preserve the structure
  const treePartidas = JSON.parse(JSON.stringify(currentTreePartidas))

  // Ensure all capitulos up to the current index exist
  for (let i = 0; i <= capituloIndex; i++) {
    if (!treePartidas[i]) {
      treePartidas[i] = {
        id: (i + 1).toString(),
        name: conceptosStore.treeCapitulosPartidas[i]?.name || `Capitulo ${i + 1}`,
        children: []
      }
    }
    if (!treePartidas[i].children) {
      treePartidas[i].children = []
    }
  }

  if (boolValue) {
    // Add concepto to selected partidas
    const existingIndex = treePartidas[capituloIndex].children.findIndex(
      (partida: { name?: string, nom_concepto?: string }) => (partida.name || partida.nom_concepto) === concepto.nom_concepto
    )

    if (existingIndex === -1) {
      // Add the concepto only if it doesn't already exist
      treePartidas[capituloIndex].children.push({
        id: concepto.id,
        name: concepto.nom_concepto,
        desc_concepto: concepto.desc_concepto,
        capitulo: concepto.capitulo,
        capitulo_nom: conceptosStore.treeCapitulosPartidas[capituloIndex]?.name || `Capitulo ${concepto.capitulo}`
      })
      console.log('Added concepto:', concepto.nom_concepto, 'to capitulo:', capituloIndex)
    } else {
      console.log('Concepto already exists:', concepto.nom_concepto, 'at index:', existingIndex)
    }
  } else {
    // Remove concepto from selected partidas
    const existingIndex = treePartidas[capituloIndex].children.findIndex(
      (partida: { name?: string, nom_concepto?: string }) => (partida.name || partida.nom_concepto) === concepto.nom_concepto
    )

    if (existingIndex !== -1) {
      treePartidas[capituloIndex].children.splice(existingIndex, 1)
      console.log('Removed concepto:', concepto.nom_concepto, 'from capitulo:', capituloIndex)
    } else {
      console.log('Concepto not found for removal:', concepto.nom_concepto)
    }
  }

  // Log the final treePartidas structure for debugging
  console.log('Final treePartidas structure:', {
    totalCapitulos: treePartidas.length,
    capituloChildren: treePartidas.map((cap: any, idx: number) => ({
      index: idx,
      name: cap.name,
      childrenCount: cap.children?.length || 0,
      childrenNames: cap.children?.map((child: any) => child.name).slice(0, 3)
    }))
  })

  // Update the store with the new reactive array
  planStore.planActual.treePartidas = treePartidas

  // Save plan-specific capitulos and partidas if user settings allow it
  console.log('Saving plan-specific data after toggling concepto')
  const appSettings = userStore.user.appSettings
  if (appSettings?.persistPartidasPerPlan || appSettings?.persistCapitulosPerPlan) {
    await savePlanSpecificData()
  } else {
    console.log('Automatic save skipped - user settings do not allow persistence')
  }
}

// Save plan-specific capitulos and partidas based on user settings (for automatic saves)
const savePlanSpecificData = async () => {
  const planId = planStore.planActual?._id
  if (!planId) {
    console.log('No plan ID found, skipping save')
    return
  }

  const appSettings = userStore.user.appSettings
  console.log('Checking app settings for persistence:', {
    persistCapitulosPerPlan: appSettings?.persistCapitulosPerPlan,
    persistPartidasPerPlan: appSettings?.persistPartidasPerPlan
  })

  // Only save if user settings allow it
  if (!appSettings?.persistPartidasPerPlan && !appSettings?.persistCapitulosPerPlan) {
    console.log('Automatic save skipped - user settings do not allow persistence')
    return
  }

  try {
    let capitulosToSave: any[] | undefined = undefined
    let partidasToSave: any[] | undefined = undefined

    // Save capitulos if persistence is enabled
    if (appSettings?.persistCapitulosPerPlan) {
      // Extract capitulos from current tree data
      capitulosToSave = conceptosStore.treeCapitulosPartidas.map((capitulo: { id?: string, name?: string }) => ({
        id: capitulo.id,
        name: capitulo.name,
        descripcion: capitulo.name
        // Add other capitulo fields as needed
      }))
      console.log('Prepared capitulos to save:', capitulosToSave)
    }

    // Save partidas if persistence is enabled
    if (appSettings?.persistPartidasPerPlan) {
      // Extract selected partidas from treePartidas
      const treePartidas = treePartidasComputed.value
      console.log('Current treePartidas for saving:', treePartidas)

      partidasToSave = (treePartidas || [])
        .filter((capitulo: { children?: Array<unknown> }) => capitulo && capitulo.children && capitulo.children.length > 0)
        .flatMap((capitulo: { children?: Array<{ id?: string, name?: string, nom_concepto?: string, desc_concepto?: string, capitulo?: number }> }) =>
          capitulo.children?.map(partida => ({
            id: partida.id,
            nom_concepto: partida.name || partida.nom_concepto,
            desc_concepto: partida.desc_concepto,
            capitulo: partida.capitulo
            // Add other partida fields as needed
          })) || []
        )
      console.log('Prepared partidas to save:', partidasToSave)
      console.log('Total partidas to save:', partidasToSave?.length || 0)
    }

    // Save to plan if either capitulos or partidas need to be saved
    if (capitulosToSave !== undefined || partidasToSave !== undefined) {
      console.log('Saving plan-specific data:', {
        planId,
        capitulosCount: capitulosToSave?.length || 0,
        partidasCount: partidasToSave?.length || 0
      })

      const result = await planStore.savePlanCapitulosPartidas(planId, capitulosToSave, partidasToSave)
      console.log('Plan-specific data saved successfully:', {
        capitulosSaved: capitulosToSave?.length || 0,
        partidasSaved: partidasToSave?.length || 0
      })

      // After successful save, ensure the treePartidas is preserved
      if (result && result.treePartidas) {
        console.log('Received updated treePartidas from server:', result.treePartidas)
        // Don't overwrite the local treePartidas with server response to preserve UI state
        // The server might return a different structure
      }

      // Show success toast
      const toast = useToast()
      toast.add({
        title: 'Éxito',
        description: 'Partidas guardadas correctamente',
        color: 'success'
      })
    } else {
      console.log('No data to save (capitulosToSave or partidasToSave is empty)')
    }
  } catch (error) {
    console.error('Error saving plan-specific data:', error)
    // Show error toast if needed
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al guardar los datos específicos del plan: ' + (error instanceof Error ? error.message : 'Unknown error'),
      color: 'error'
    })
  }
}

// Explicit save method that always saves regardless of user settings
const explicitSavePlanData = async () => {
  const planId = planStore.planActual?._id
  if (!planId) {
    console.log('No plan ID found, skipping save')
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'No se encontró el plan para guardar',
      color: 'error'
    })
    return
  }

  try {
    // Always prepare capitulos and partidas for explicit saves, regardless of settings
    // Extract capitulos from current tree data
    const capitulosToSave = conceptosStore.treeCapitulosPartidas.map((capitulo: { id?: string, name?: string }) => ({
      id: capitulo.id,
      name: capitulo.name,
      descripcion: capitulo.name
      // Add other capitulo fields as needed
    }))
    console.log('Prepared capitulos to save:', capitulosToSave)

    // Extract selected partidas from treePartidas
    const treePartidas = treePartidasComputed.value
    const partidasToSave = (treePartidas || [])
      .filter((capitulo: { children?: Array<unknown> }) => capitulo && capitulo.children && capitulo.children.length > 0)
      .flatMap((capitulo: { children?: Array<{ id?: string, name?: string, nom_concepto?: string, desc_concepto?: string, capitulo?: number }> }) =>
        capitulo.children?.map(partida => ({
          id: partida.id,
          nom_concepto: partida.name || partida.nom_concepto,
          desc_concepto: partida.desc_concepto,
          capitulo: partida.capitulo
          // Add other partida fields as needed
        })) || []
      )
    console.log('Prepared partidas to save:', partidasToSave)

    // Save to plan if we have data to save
    if (capitulosToSave.length > 0 || partidasToSave.length > 0) {
      console.log('Saving plan-specific data:', { planId, capitulosToSave, partidasToSave })
      await planStore.savePlanCapitulosPartidas(planId, capitulosToSave, partidasToSave)
      console.log('Plan-specific data saved:', { capitulosToSave, partidasToSave })

      // Show success toast
      const toast = useToast()
      toast.add({
        title: 'Éxito',
        description: 'Partidas guardadas correctamente',
        color: 'success'
      })
    } else {
      console.log('No data to save (capitulosToSave or partidasToSave is empty)')

      // Show info toast
      const toast = useToast()
      toast.add({
        title: 'Información',
        description: 'No hay partidas seleccionadas para guardar',
        color: 'info'
      })
    }
  } catch (error) {
    console.error('Error saving plan-specific data:', error)
    // Show error toast if needed
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Error al guardar los datos específicos del plan: ' + (error instanceof Error ? error.message : 'Unknown error'),
      color: 'error'
    })
  }
}

// Edit concepto
const editConcepto = (concepto: MiniConcepto) => {
  selectedConcepto.value = concepto
  isEditMode.value = true
  showEditModal.value = true
}

// Copy concepto
const copyConcepto = (concepto: MiniConcepto) => {
  selectedConcepto.value = concepto
  isEditMode.value = false
  showEditModal.value = true
}

// Handle concepto saved
const onConceptoSaved = (_savedConcepto: unknown) => {
  console.log('Concepto saved:', _savedConcepto)
  // Refresh the tree data if needed
  // You might want to reload the tree or update the specific concepto
}

// Compute selected and total partidas count
const selectedPartidasCount = computed(() => {
  const treePartidas = treePartidasComputed.value
  if (!Array.isArray(treePartidas)) return 0

  return treePartidas.reduce((total, capitulo) => {
    return total + (capitulo?.children?.length || 0)
  }, 0)
})

const totalPartidasCount = computed(() => {
  if (!conceptosStore.treeCapitulosPartidas || !Array.isArray(conceptosStore.treeCapitulosPartidas)) return 0

  return conceptosStore.treeCapitulosPartidas.reduce((total, capitulo) => {
    return total + (capitulo?.children?.length || 0)
  }, 0)
})

// Compute selected partidas count for a specific capitulo
const getCapituloSelectedCount = (capituloIndex: number) => {
  const treePartidas = treePartidasComputed.value
  if (!Array.isArray(treePartidas) || !treePartidas[capituloIndex]) {
    return 0
  }
  return treePartidas[capituloIndex]?.children?.length || 0
}

// Compute total partidas count for a specific capitulo
const getCapituloTotalCount = (capituloIndex: number) => {
  if (!conceptosStore.treeCapitulosPartidas
    || !Array.isArray(conceptosStore.treeCapitulosPartidas)
    || !conceptosStore.treeCapitulosPartidas[capituloIndex]) {
    return 0
  }
  return conceptosStore.treeCapitulosPartidas[capituloIndex]?.children?.length || 0
}

// Get styling for concepto items (exactly like ElementBase.vue)
const getConceptoStyling = (concepto: MiniConcepto): string => {
  // Use exact same logic as ElementBase.vue lines 123-124
  const isAdminView = 'isAdminView' in concepto ? concepto.isAdminView : false
  const isOwner = 'isOwner' in concepto ? concepto.isOwner : true

  // Base styling
  let baseClasses = 'hover:bg-gray-50 dark:hover:bg-gray-800/50'

  // For conceptos (exactly like ElementBase.vue lines 146-171)
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
    if (concepto.isAdminConcepto) {
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

  return baseClasses
}

// Get badge info for concepto items (exactly like ElementBase.vue)
const getConceptoBadgeInfo = (concepto: MiniConcepto) => {
  // Use exact same logic as ElementBase.vue lines 177-178
  const isAdminView = 'isAdminView' in concepto ? concepto.isAdminView : false
  const isOwner = 'isOwner' in concepto ? concepto.isOwner : true

  // For conceptos (exactly like ElementBase.vue lines 191-209)
  if (isAdminView) {
    if (isOwner) {
      return { text: 'Mi Concepto', color: 'green', icon: 'i-lucide-user-check' }
    } else {
      return { text: 'Usuario', color: 'blue', icon: 'i-lucide-users' }
    }
  } else {
    if (concepto.isAdminConcepto) {
      return { text: 'Admin', color: 'purple', icon: 'i-lucide-shield-check' }
    } else if (isOwner) {
      return { text: 'Personal', color: 'gray', icon: 'i-lucide-user' }
    } else {
      return { text: 'Otro Usuario', color: 'orange', icon: 'i-lucide-user-minus' }
    }
  }
}

// Simple tree structure without complex slots
const treeItems = computed<TreeItem[]>(() => {
  console.log('Building tree items from:', conceptosStore.treeCapitulosPartidas)

  if (!conceptosStore.treeCapitulosPartidas || conceptosStore.treeCapitulosPartidas.length === 0) {
    return []
  }

  return conceptosStore.treeCapitulosPartidas.map((capitulo: MiniCapituloConceptos, capituloIndex: number) => ({
    label: capitulo.name,
    icon: 'i-heroicons-cube-transparent',
    defaultExpanded: true,
    children: capitulo.children?.map((concepto: MiniConcepto) => ({
      label: concepto.nom_concepto,
      value: concepto.id?.toString() || ''
      // We'll handle checkboxes in the template
    })) || []
  }))
})
</script>

<template>
  <div>
    <!-- Header with partidas count badge and admin toggle -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Selección de Partidas
      </h3>
      <div class="flex items-center gap-4">
        <!-- Toggle for filtering conceptos -->
        <div class="flex items-center gap-2">
          <USwitch
            v-model="showOnlyOwnConceptos"
            size="sm"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            <template v-if="userStore.user?.role === 'admin'">
              {{ showOnlyOwnConceptos ? 'Ver todos los usuarios' : 'Ver solo mis conceptos' }}
            </template>
            <template v-else>
              {{ showOnlyOwnConceptos ? 'Ver solo mis conceptos' : 'Ver mis conceptos + admin' }}
            </template>
          </span>
        </div>

        <UBadge
          :color="selectedPartidasCount > 0 ? 'primary' : 'neutral'"
          variant="subtle"
          size="lg"
          class="font-medium"
        >
          {{ selectedPartidasCount }} / {{ totalPartidasCount }} seleccionadas
        </UBadge>
      </div>
    </div>

    <!-- User Settings Info -->
    <div
      v-if="userStore.user?.appSettings"
      class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm"
    >
      <div class="flex items-start gap-2">
        <UIcon
          name="i-heroicons-information-circle"
          class="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5"
        />
        <div>
          <p class="font-medium text-blue-800 dark:text-blue-200">
            Configuración de Persistencia
          </p>
          <p class="text-blue-700 dark:text-blue-300">
            Capítulos: <span :class="userStore.user.appSettings.persistCapitulosPerPlan ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400'">
              {{ userStore.user.appSettings.persistCapitulosPerPlan ? 'Sí' : 'No' }}
            </span> |
            Partidas: <span :class="userStore.user.appSettings.persistPartidasPerPlan ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400'">
              {{ userStore.user.appSettings.persistPartidasPerPlan ? 'Sí' : 'No' }}
            </span>
          </p>
          <p
            v-if="!userStore.user.appSettings.persistPartidasPerPlan"
            class="text-orange-600 dark:text-orange-400 mt-1"
          >
            La persistencia de partidas está desactivada. Usa el botón "Guardar Partidas Seleccionadas" para guardar manualmente.
            <UButton
              size="xs"
              color="info"
              variant="ghost"
              class="ml-2"
              @click="navigateTo(`/protected/usuarios/${userStore.user._id}/settings`)"
            >
              Configurar
            </UButton>
          </p>
        </div>
      </div>
    </div>

    <!-- Legend for visual indicators -->
    <div
      v-if="userStore.user?.role === 'admin'"
      class="mb-3 flex flex-wrap gap-2 text-xs"
    >
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 bg-green-500 rounded-sm" />
        <span>Mis conceptos</span>
      </div>
      <div
        v-if="showOnlyOwnConceptos"
        class="flex items-center gap-1"
      >
        <div class="w-3 h-3 bg-blue-500 rounded-sm" />
        <span>Otros usuarios</span>
      </div>
    </div>
    <!-- Legend for regular users -->
    <div
      v-else
      class="mb-3 flex flex-wrap gap-2 text-xs"
    >
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 bg-gray-500 rounded-sm" />
        <span>Personal</span>
      </div>
      <div
        v-if="!showOnlyOwnConceptos"
        class="flex items-center gap-1"
      >
        <div class="w-3 h-3 bg-purple-500 rounded-sm" />
        <span>Admin (compartido)</span>
      </div>
    </div>

    <!-- Loading Progress Bar -->
    <LoadingProgressBar
      :is-visible="isLoadingWithProgress"
      :current-step="currentProgressStep"
      class="mb-6"
    />

    <!-- Debug info -->
    <div
      v-if="!isLoadingWithProgress && conceptosStore.treeCapitulosPartidas.length === 0"
      class="p-4 text-gray-500"
    >
      No data available in treeCapitulosPartidas
    </div>

    <!-- Debug: Show current state -->
    <div class="p-2 mb-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm border border-gray-300 dark:border-gray-600 rounded">
      <p>Tree items length: {{ treeItems.length }}</p>
      <p>TreeCapitulosPartidas length: {{ conceptosStore.treeCapitulosPartidas.length }}</p>
    </div>

    <!-- Manual rendering with checkboxes (always use this) -->
    <div
      v-if="conceptosStore.treeCapitulosPartidas.length > 0"
      class="space-y-4"
    >
      <div
        v-for="(capitulo, capituloIndex) in conceptosStore.treeCapitulosPartidas"
        :key="capituloIndex"
        class="border rounded-lg p-4"
      >
        <div
          class="flex items-center gap-2 font-semibold mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
          @click="toggleCapitulo(capituloIndex)"
        >
          <UIcon
            :name="isCapituloExpanded(capituloIndex) ? 'i-heroicons-cube-transparent' : 'i-heroicons-cube'"
            class="w-4 h-4"
          />
          <span class="flex-1">
            {{ capitulo.name }}
            <span class="text-sm text-gray-500 ml-2">({{ capitulo.children?.length || 0 }} conceptos)</span>
          </span>

          <!-- Badge for this capitulo -->
          <UBadge
            :color="getCapituloSelectedCount(capituloIndex) > 0 ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            class="font-medium mr-2"
          >
            {{ getCapituloSelectedCount(capituloIndex) }}/{{ getCapituloTotalCount(capituloIndex) }}
          </UBadge>

          <UIcon
            :name="isCapituloExpanded(capituloIndex) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
            class="w-4 h-4 text-gray-500"
          />
        </div>

        <div
          v-if="isCapituloExpanded(capituloIndex)"
          class="ml-6 space-y-2"
        >
          <!-- Debug: Check if capitulo has children -->
          <div
            v-if="!capitulo.children || capitulo.children.length === 0"
            class="text-sm text-gray-500 p-4 bg-gray-50 rounded"
          >
            No hay conceptos disponibles en este capítulo.
            <br>
            <span
              v-if="showOnlyOwnConceptos"
              class="text-xs"
            >
              Prueba cambiando el filtro para ver más conceptos.
            </span>
          </div>
          <div
            v-for="concepto in capitulo.children"
            :key="concepto.id"
            :class="[
              'flex items-center gap-2 group p-2 rounded transition-colors',
              getConceptoStyling(concepto)
            ]"
          >
            <UCheckbox
              :model-value="isConceptoSelected(concepto, capituloIndex)"
              :name="concepto.nom_concepto"
              class="flex-1"
              @update:model-value="(value: boolean | 'indeterminate') => toggleConcepto(concepto, capituloIndex, value)"
            >
              <template #label>
                <div class="flex items-center w-full">
                  <span class="text-gray-900 dark:text-white flex-1 truncate">{{ concepto.nom_concepto }}</span>
                  <UBadge
                    v-if="getConceptoBadgeInfo(concepto)"
                    :color="getConceptoBadgeInfo(concepto)?.color as any"
                    variant="subtle"
                    size="xs"
                    class="flex-shrink-0 ml-2"
                  >
                    <UIcon
                      v-if="getConceptoBadgeInfo(concepto)?.icon"
                      :name="getConceptoBadgeInfo(concepto)?.icon as string"
                      class="w-3 h-3 mr-1"
                    />
                    {{ getConceptoBadgeInfo(concepto)?.text }}
                  </UBadge>
                </div>
              </template>
            </UCheckbox>

            <!-- Owner info and action buttons in a single row -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- Owner info -->
              <div
                v-if="concepto.isAdminView && !concepto.isOwner"
                class="text-xs text-blue-600 dark:text-blue-400 flex items-center"
              >
                <UIcon
                  name="i-lucide-user"
                  class="w-3 h-3 mr-1"
                />
                <span class="font-medium truncate max-w-xs">{{ concepto.ownerName || 'Usuario desconocido' }}</span>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-pencil"
                  class="w-6 h-6 rounded-full"
                  @click.stop="editConcepto(concepto)"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-document-duplicate"
                  class="w-6 h-6 rounded-full"
                  @click.stop="copyConcepto(concepto)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end mt-6">
      <UButton
        color="primary"
        :loading="isLoadingWithProgress"
        @click="explicitSavePlanData"
      >
        Guardar Partidas Seleccionadas
      </UButton>
    </div>

    <!-- Edit/Copy Modal -->
    <ModalEditConcepto
      :model-value="showEditModal"
      :concepto="selectedConcepto"
      :is-edit="isEditMode"
      @update:model-value="showEditModal = $event"
      @saved="onConceptoSaved"
    />
  </div>
</template>
