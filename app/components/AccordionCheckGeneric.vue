<script setup lang="ts">
import { computed } from 'vue'
import { useConceptoStore } from '@/stores/conceptos'
import type { Concepto } from '@/stores/conceptos'

const conceptosStore = useConceptoStore()
const conceptoActual: ComputedRef<Concepto> = computed(
  () => conceptosStore.conceptoActual
)

const conceptoMediosGeneric: ComputedRef<MediosGeneric> = computed(() => ({
  epis: conceptosStore.epis,
  pqs: conceptosStore.pqs,
  maqs: conceptosStore.maqs,
  pcols: conceptosStore.pcols,
  medauxs: conceptosStore.medauxs
}))

interface mediositems {
  label: string
  icon: string
  defaultOpen: boolean
  slot: string
  description2: string[]
}
const itemsMedios: mediositems[] = [
  {
    label: 'Productos Químicos',
    icon: 'i-heroicons-beaker',
    defaultOpen: true,
    slot: 'pqs',
    description2: conceptoActual.value.pqs
  },
  {
    label: 'EPIS',
    icon: 'i-heroicons-hand-raised',
    defaultOpen: true,
    slot: 'epis',
    description2: conceptoActual.value.epis
  },
  {
    label: 'Protecciones Colectivas',
    icon: 'i-heroicons-queue-list',
    defaultOpen: true,
    slot: 'pcols',
    description2: conceptoActual.value.pcols
  },
  {
    label: 'Maquinaría',
    icon: 'i-heroicons-cog-8-tooth',
    defaultOpen: true,
    slot: 'maqs',
    description2: conceptoActual.value.maqs
  },
  {
    label: 'Medios Auxiliares',
    icon: 'i-heroicons-wrench-screwdriver',
    defaultOpen: true,
    slot: 'medauxs',
    description2: conceptoActual.value.medauxs
  }
]

// Method to check if the item is in the description2 array
const isChecked = (description2: string[], name: string) => {
  return description2.includes(name)
}

// Computed property to handle v-model
const getCheckboxModel = (
  description2: string[],
  name: string,
  slot: keyof Concepto
) => {
  return computed({
    get: () => isChecked(description2, name),
    set: (value: boolean) => {
      if (value) {
        if (!description2.includes(name)) {
          description2.push(name)
          // I need to pass the changes to the store, copied on store twice
          // if (
          //   conceptoActual !== undefined &&
          //   conceptoActual !== null &&
          //   slot !== undefined &&
          //   slot !== null &&
          //   Array.isArray(conceptoActual.value[slot])
          // ) {
          //   (conceptoActual.value[slot] as string[]).push(name);
          // }
        }
      } else {
        const index = description2.indexOf(name)
        if (index > -1) {
          description2.splice(index, 1)
          if (conceptoActual.value && slot && Array.isArray(conceptoActual.value[slot])) {
            const slotIndex = (conceptoActual.value[slot] as string[]).indexOf(name)
            if (slotIndex > -1) {
              (conceptoActual.value[slot] as string[]).splice(slotIndex, 1)
            }
          }
        }
      }
    }
  })
}
</script>

<template>
  <UAccordion :items="itemsMedios">
    <template #default="{ item, open }">
      <div class="flex items-left justify-between w-full">
        <div class="flex items-center gap-2">
          <span>{{ item.label }}</span>
        </div>
        <div class="flex items-center">
          <div class="mx-3">
            <UBadge
              color="primary"
              variant="solid"
              size="sm"
              :label="item.description2?.length || 0"
              :title="`${item.description2?.length || 0} de ${conceptoMediosGeneric[item.slot]?.length || 0} seleccionados`"
            />
          </div>
        </div>
      </div>
    </template>
    <template #pqs="{ item }">
      <p
        v-for="el in conceptoMediosGeneric[item.slot]"
        class="italic text-gray-900 dark:text-white text-left"
      >
        <UCheckbox
          v-model="getCheckboxModel(item.description2, el, 'pqs').value"
          :name="el"
          :label="el"
        />
      </p>
    </template>
    <template #maqs="{ item }">
      <p
        v-for="el in conceptoMediosGeneric[item.slot]"
        class="italic text-gray-900 dark:text-white text-left"
      >
        <UCheckbox
          v-model="getCheckboxModel(item.description2, el, 'maqs').value"
          :name="el"
          :label="el"
        />
      </p>
    </template>
    <template #pcols="{ item }">
      <p
        v-for="el in conceptoMediosGeneric[item.slot]"
        class="italic text-gray-900 dark:text-white text-left"
      >
        <UCheckbox
          v-model="getCheckboxModel(item.description2, el, 'pcols').value"
          :name="el"
          :label="el"
        />
      </p>
    </template>
    <template #medauxs="{ item }">
      <p
        v-for="el in conceptoMediosGeneric[item.slot]"
        class="italic text-gray-900 dark:text-white text-left"
      >
        <UCheckbox
          v-model="getCheckboxModel(item.description2, el, 'medauxs').value"
          :name="el"
          :label="el"
        />
      </p>
    </template>
    <template #epis="{ item }">
      <p
        v-for="el in conceptoMediosGeneric[item.slot]"
        class="italic text-gray-900 dark:text-white text-left"
      >
        <UCheckbox
          v-model="getCheckboxModel(item.description2, el, 'epis').value"
          :name="el"
          :label="el"
        />
      </p>
    </template>
  </UAccordion>
</template>
