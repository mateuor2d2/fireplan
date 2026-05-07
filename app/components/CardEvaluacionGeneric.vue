<script setup lang="ts">
import type { Concepto, EvaluacionActual, Riesgo, Probabilidad, Gravedad } from '~/stores/conceptos'
import { useConceptoStore } from '~/stores/conceptos'

const storeConceptos = useConceptoStore()

function addEvaluacion() {
  storeConceptos.conceptoActual.evaluaciones.unshift({
    gravedad: { id: 0, descripcion: '' },
    probabilidad: { id: 0, descripcion: '' },
    riesgo: { id: 0, descripcion: '' }
  })
}

function deleteEvaluacion(index: number) {
  storeConceptos.conceptoActual.evaluaciones.splice(index, 1)
}

function handleRiesgoChange(index: number, selectedRiesgo: Riesgo) {
  if (storeConceptos.conceptoActual.evaluaciones?.[index]) {
    storeConceptos.conceptoActual.evaluaciones[index].riesgo = selectedRiesgo
  }
}

function handleProbabilidadChange(index: number, selectedProbabilidad: Probabilidad) {
  if (storeConceptos.conceptoActual.evaluaciones?.[index]) {
    storeConceptos.conceptoActual.evaluaciones[index].probabilidad = selectedProbabilidad
  }
}

function handleGravedadChange(index: number, selectedGravedad: Gravedad) {
  if (storeConceptos.conceptoActual.evaluaciones?.[index]) {
    storeConceptos.conceptoActual.evaluaciones[index].gravedad = selectedGravedad
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">
          Evaluaciones
        </h3>
        <UButton
          icon="i-heroicons-plus"
          size="sm"
          color="primary"
          variant="solid"
          trailing
          @click="addEvaluacion()"
        >
          Nueva Evaluación
        </UButton>
      </div>
    </template>

    <div
      v-for="(evaluacion, index) in storeConceptos.conceptoActual.evaluaciones"
      :key="index"
      class="mb-4 p-4 border rounded-lg"
    >
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div class="md:col-span-2">
          <UFormField
            label="Riesgo"
            :required="true"
          >
            <USelectMenu
              v-model="evaluacion.riesgo"
              :items="storeConceptos.riesgos"
              label-key="descripcion"
              class="w-full"
            />
          </UFormField>
        </div>
        <div>
          <UFormField
            label="Probabilidad"
            :required="true"
          >
            <USelectMenu
              v-model="evaluacion.probabilidad"
              :items="storeConceptos.probabilidad"
              label-key="descripcion"
              class="w-full"
            />
          </UFormField>
        </div>

        <div>
          <UFormField
            label="Gravedad"
            :required="true"
          >
            <USelectMenu
              v-model="evaluacion.gravedad"
              :items="storeConceptos.gravedad"
              label-key="descripcion"
              class="w-full"
            />
          </UFormField>
        </div>
        <div>
          <UButton
            icon="i-heroicons-trash"
            size="sm"
            color="primary"
            square
            variant="solid"
            @click="deleteEvaluacion(index)"
          />
        </div>
      </div>
    </div>
    <template #footer />
  </UCard>
</template>
