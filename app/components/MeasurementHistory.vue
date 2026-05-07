<template>
  <div class="measurement-history">
    <!-- Header with count -->
    <div class="flex justify-between items-center mb-3">
      <h4 class="text-sm font-medium">
        Measurement History ({{ measurements.length }} total)
      </h4>
      <div class="flex gap-2 text-xs">
        <UButton
          size="xs"
          variant="ghost"
          :disabled="allExpanded"
          @click="expandAll"
        >
          Expand All
        </UButton>
        <UButton
          size="xs"
          variant="ghost"
          :disabled="!anyExpanded"
          @click="collapseAll"
        >
          Collapse All
        </UButton>
      </div>
    </div>

    <!-- Search and filters -->
    <div class="mb-3 space-y-2">
      <UInput
        v-model="searchQuery"
        placeholder="Search measurements..."
        size="sm"
        icon="i-heroicons-magnifying-glass"
      />
      <div class="flex gap-2">
        <USelect
          v-model="filterLegionella"
          :items="legionellaFilterOptions"
          size="xs"
          placeholder="Filter by Legionella"
        />
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          size="xs"
        />
      </div>
    </div>

    <!-- Virtual scrolling container for large datasets -->
    <div
      ref="scrollContainer"
      class="max-h-80 overflow-y-auto border border-gray-200 rounded bg-gray-50"
      @scroll="handleScroll"
    >
      <div class="p-2 space-y-1">
        <!-- Only render visible items for performance -->
        <div
          v-for="(measurement, index) in visibleMeasurements"
          :key="`${measurement.date}-${measurement.time}-${index}`"
          class="measurement-card bg-white rounded shadow-sm border transition-all duration-200"
          :class="{ expanded: expandedItems.has(index) }"
        >
          <!-- Measurement header (always visible) -->
          <div
            class="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-50"
            @click="toggleExpanded(index)"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <strong class="text-blue-700 text-xs">{{ measurement.date }} {{ measurement.time }}</strong>
                <span class="text-gray-600 text-xs">{{ measurement.person || 'Unknown' }}</span>
                <span
                  :class="measurement.legionellaDetected ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
                  class="px-1 py-0.5 rounded text-xs"
                >
                  {{ measurement.legionellaDetected ? '🦠 DETECTED' : '✓ Clear' }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <UIcon
                :name="expandedItems.has(index) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                class="w-4 h-4 text-gray-400"
              />
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                :title="`Remove measurement from ${measurement.date} ${measurement.time}`"
                @click.stop="$emit('remove-measurement', getOriginalIndex(measurement, index))"
              />
            </div>
          </div>

          <!-- Expanded details -->
          <div
            v-if="expandedItems.has(index)"
            class="px-2 pb-2 border-t border-gray-100"
          >
            <div class="mt-2 flex flex-wrap gap-2 text-xs">
              <span
                v-if="measurement.temperature && measurement.temperature > 0"
                class="bg-blue-100 px-2 py-1 rounded"
              >
                🌡️ {{ measurement.temperature }}°C
              </span>
              <span
                v-if="measurement.ph && measurement.ph > 0"
                class="bg-green-100 px-2 py-1 rounded"
              >
                pH {{ measurement.ph }}
              </span>
            </div>
            <div
              v-if="measurement.notes"
              class="mt-2 text-xs text-gray-600 italic bg-gray-50 p-2 rounded"
            >
              "{{ measurement.notes }}"
            </div>
          </div>
        </div>

        <!-- Loading indicator for virtual scrolling -->
        <div
          v-if="isLoading"
          class="text-center py-4 text-xs text-gray-500"
        >
          Loading more measurements...
        </div>

        <!-- Empty state -->
        <div
          v-if="filteredMeasurements.length === 0"
          class="text-center py-8 text-gray-500 text-sm"
        >
          <div class="mb-2">
            📊
          </div>
          <div>{{ searchQuery ? 'No measurements match your search' : 'No measurements recorded yet' }}</div>
        </div>
      </div>
    </div>

    <!-- Summary stats -->
    <div
      v-if="measurements.length > 0"
      class="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded"
    >
      <div class="grid grid-cols-2 gap-2">
        <div>Total: {{ measurements.length }}</div>
        <div>Legionella Detected: {{ legionellaDetectedCount }}</div>
        <div v-if="avgTemperature">
          Avg Temp: {{ avgTemperature }}°C
        </div>
        <div v-if="avgPh">
          Avg pH: {{ avgPh }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MeasurementData {
  date: string
  time: string
  person: string
  temperature?: number
  ph?: number
  legionellaDetected: boolean
  notes: string
}

interface Props {
  measurements: MeasurementData[]
}

interface Emits {
  (e: 'remove-measurement', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const searchQuery = ref('')
const filterLegionella = ref<string | null>(null)
const sortBy = ref('newest')
const expandedItems = ref(new Set<number>())
const scrollContainer = ref<HTMLElement>()
const isLoading = ref(false)

// Virtual scrolling for performance
const itemsPerPage = 50
const currentPage = ref(1)

// Filter and sort options
const legionellaFilterOptions = [
  { label: 'All', value: null },
  { label: 'Detected Only', value: 'detected' },
  { label: 'Clear Only', value: 'clear' }
]

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Person A-Z', value: 'person' },
  { label: 'Temperature', value: 'temperature' }
]

// Computed properties
const sortedMeasurements = computed(() => {
  const sorted = [...props.measurements]

  switch (sortBy.value) {
    case 'oldest':
      sorted.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}:00`)
        const dateTimeB = new Date(`${b.date}T${b.time}:00`)
        return dateTimeA.getTime() - dateTimeB.getTime()
      })
      break
    case 'person':
      sorted.sort((a, b) => (a.person || '').localeCompare(b.person || ''))
      break
    case 'temperature':
      sorted.sort((a, b) => (b.temperature || 0) - (a.temperature || 0))
      break
    default: // newest
      sorted.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}:00`)
        const dateTimeB = new Date(`${b.date}T${b.time}:00`)
        return dateTimeB.getTime() - dateTimeA.getTime()
      })
  }

  return sorted
})

const filteredMeasurements = computed(() => {
  let filtered = sortedMeasurements.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(m =>
      m.person.toLowerCase().includes(query)
      || m.notes.toLowerCase().includes(query)
      || m.date.includes(query)
    )
  }

  // Apply legionella filter
  if (filterLegionella.value === 'detected') {
    filtered = filtered.filter(m => m.legionellaDetected)
  } else if (filterLegionella.value === 'clear') {
    filtered = filtered.filter(m => !m.legionellaDetected)
  }

  return filtered
})

const visibleMeasurements = computed(() => {
  const endIndex = currentPage.value * itemsPerPage
  return filteredMeasurements.value.slice(0, endIndex)
})

const allExpanded = computed(() =>
  expandedItems.value.size === visibleMeasurements.value.length
)

const anyExpanded = computed(() =>
  expandedItems.value.size > 0
)

const legionellaDetectedCount = computed(() =>
  props.measurements.filter(m => m.legionellaDetected).length
)

const avgTemperature = computed(() => {
  const temps = props.measurements.filter(m => m.temperature && m.temperature > 0).map(m => m.temperature!)
  if (temps.length === 0) return null
  return Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
})

const avgPh = computed(() => {
  const phs = props.measurements.filter(m => m.ph && m.ph > 0).map(m => m.ph!)
  if (phs.length === 0) return null
  return Math.round((phs.reduce((a, b) => a + b, 0) / phs.length) * 10) / 10
})

// Methods
const toggleExpanded = (index: number) => {
  if (expandedItems.value.has(index)) {
    expandedItems.value.delete(index)
  } else {
    expandedItems.value.add(index)
  }
}

const expandAll = () => {
  visibleMeasurements.value.forEach((_, index) => {
    expandedItems.value.add(index)
  })
}

const collapseAll = () => {
  expandedItems.value.clear()
}

const getOriginalIndex = (measurement: MeasurementData, sortedIndex: number): number => {
  return props.measurements.findIndex(m =>
    m.date === measurement.date
    && m.time === measurement.time
    && m.person === measurement.person
    && m.temperature === measurement.temperature
    && m.ph === measurement.ph
    && m.legionellaDetected === measurement.legionellaDetected
    && m.notes === measurement.notes
  )
}

const handleScroll = () => {
  if (!scrollContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

  // Load more items when scrolled to 80%
  if (scrollPercentage > 0.8 && !isLoading.value && visibleMeasurements.value.length < filteredMeasurements.value.length) {
    isLoading.value = true
    setTimeout(() => {
      currentPage.value++
      isLoading.value = false
    }, 300)
  }
}

// Reset pagination when filters change
watch([searchQuery, filterLegionella, sortBy], () => {
  currentPage.value = 1
  expandedItems.value.clear()
})
</script>

<style scoped>
.measurement-card {
  transition: all 0.2s ease;
}

.measurement-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.measurement-card.expanded {
  border-color: #3b82f6;
}
</style>
