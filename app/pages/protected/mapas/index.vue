<script setup lang="ts">
definePageMeta({ layout: 'app' })
const store = useFireplanStore()
const { centers } = storeToRefs(store)
const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
let markers: any[] = []

onMounted(async () => {
  await store.fetchCenters()
  if (process.client && mapContainer.value) {
    const L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')
    
    map = L.map(mapContainer.value).setView([40.4168, -3.7038], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
    
    updateMarkers(L)
  }
})

watch(centers, async () => {
  if (map && process.client) {
    const L = await import('leaflet')
    updateMarkers(L)
  }
})

function updateMarkers(L: any) {
  markers.forEach(m => map.removeLayer(m))
  markers = []
  
  centers.value.forEach((center: any) => {
    const lat = center.address?.coordinates?.lat
    const lng = center.address?.coordinates?.lng
    if (lat && lng) {
      const marker = L.marker([lat, lng]).addTo(map)
      marker.bindPopup(`<b>${center.name}</b><br>${center.activity || ''}<br><a href="/protected/centers/${center._id}">Ver detalles</a>`)
      markers.push(marker)
    }
  })
  
  if (markers.length > 0) {
    const group = new L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.1))
  }
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-2">Mapa de Emergencia</h1>
    <p class="text-gray-500 mb-4">Visualiza la ubicacion de tus centros</p>
    <div ref="mapContainer" class="w-full h-[600px] rounded-lg border" />
    <div v-if="centers.length === 0" class="text-center py-8 text-gray-500">
      No hay centros con coordenadas registradas.
    </div>
  </div>
</template>

<style>
@import 'leaflet/dist/leaflet.css';
</style>
