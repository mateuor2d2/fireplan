<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-2">Mapa de Emergencia</h1>
    <p class="text-gray-500 mb-4">Visualiza rutas de emergencia y puntos críticos</p>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2">
        <UCard class="h-[600px]">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-map" class="w-5 h-5" />
              <span class="font-semibold">Mapa</span>
            </div>
          </template>
          <div class="w-full h-full bg-gray-100 rounded flex items-center justify-center">
            <div class="text-center text-gray-500">
              <UIcon name="i-heroicons-map-pin" class="w-12 h-12 mx-auto mb-2" />
              <p>Mapa interactivo con Leaflet</p>
              <p class="text-sm">Integración con OpenStreetMap + OSRM</p>
              <p class="text-xs mt-2">Configura las coordenadas del centro para visualizar</p>
            </div>
          </div>
        </UCard>
      </div>
      <div class="space-y-4">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
              <span class="font-semibold">Punto de Encuentro</span>
            </div>
          </template>
          <div class="text-sm space-y-2">
            <UInput v-model="puntoEncuentro.lat" placeholder="Latitud" type="number" />
            <UInput v-model="puntoEncuentro.lng" placeholder="Longitud" type="number" />
            <UInput v-model="puntoEncuentro.descripcion" placeholder="Descripción" />
            <UButton size="sm" block @click="guardarPuntoEncuentro">Guardar</UButton>
          </div>
        </UCard>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-building-office-2" class="w-5 h-5" />
              <span class="font-semibold">Centro de Control</span>
            </div>
          </template>
          <div class="text-sm space-y-2">
            <UInput v-model="centroControl.lat" placeholder="Latitud" type="number" />
            <UInput v-model="centroControl.lng" placeholder="Longitud" type="number" />
            <UInput v-model="centroControl.descripcion" placeholder="Descripción" />
            <UButton size="sm" block @click="guardarCentroControl">Guardar</UButton>
          </div>
        </UCard>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-truck" class="w-5 h-5" />
              <span class="font-semibold">Rutas de Emergencia</span>
            </div>
          </template>
          <div class="space-y-2">
            <UButton size="sm" variant="outline" block icon="i-heroicons-fire">Bomberos → Centro</UButton>
            <UButton size="sm" variant="outline" block icon="i-heroicons-heart">Centro → Hospital</UButton>
            <UButton size="sm" variant="outline" block icon="i-heroicons-arrow-right">Vía evacuación</UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'app' })
const toast = useToast()
const puntoEncuentro = reactive({ lat: '', lng: '', descripcion: '' })
const centroControl = reactive({ lat: '', lng: '', descripcion: '' })

function guardarPuntoEncuentro() {
  toast.add({ title: 'Punto de encuentro guardado', color: 'success' })
}
function guardarCentroControl() {
  toast.add({ title: 'Centro de control guardado', color: 'success' })
}
</script>
