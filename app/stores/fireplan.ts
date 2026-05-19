import { defineStore } from 'pinia'

export interface Center {
  _id: string
  name: string
  address?: { street?: string; city?: string; postalCode?: string }
  sector?: string
  activity?: string
  maxOccupancy?: number
  status: string
  createdAt?: string
}

export interface EmergencyPlan {
  _id: string
  centerId: string
  version: number
  status: string
  datosIdentificativos?: any
  organizacion?: any
  recursos?: any
  procedimientos?: any
  createdAt?: string
}

export interface Incident {
  _id: string
  centerId: string
  code: string
  type: string
  category: string
  severity: string
  title: string
  status: string
  createdAt?: string
}

export const useFireplanStore = defineStore('fireplan', () => {
  const centers = ref<Center[]>([])
  const plans = ref<EmergencyPlan[]>([])
  const incidents = ref<Incident[]>([])
  const currentCenter = ref<Center | null>(null)
  const currentPlan = ref<EmergencyPlan | null>(null)
  const currentIncident = ref<Incident | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function fetchCenters() {
    loading.value = true
    try {
      const res = await ('/api/v1/centers')
      centers.value = res.data || []
    } catch (e: any) { error.value = e.message }
    finally { loading.value = false }
  }

  async function fetchPlans(centerId?: string) {
    loading.value = true
    try {
      const res = await ('/api/v1/plans', { query: centerId ? { centerId } : {} })
      plans.value = res.data || []
    } catch (e: any) { error.value = e.message }
    finally { loading.value = false }
  }

  async function fetchIncidents(centerId?: string) {
    loading.value = true
    try {
      const res = await ('/api/v1/incidents', { query: centerId ? { centerId } : {} })
      incidents.value = res.data || []
    } catch (e: any) { error.value = e.message }
    finally { loading.value = false }
  }

  async function createCenter(data: any) {
    const res = await ('/api/v1/centers', { method: 'POST', body: data })
    centers.value.unshift(res.data)
    return res.data
  }

  async function createPlan(data: any) {
    const res = await ('/api/v1/plans', { method: 'POST', body: data })
    plans.value.unshift(res.data)
    return res.data
  }

  async function createIncident(data: any) {
    const res = await ('/api/v1/incidents', { method: 'POST', body: data })
    incidents.value.unshift(res.data)
    return res.data
  }

  return {
    centers, plans, incidents,
    currentCenter, currentPlan, currentIncident,
    loading, error,
    fetchCenters, fetchPlans, fetchIncidents,
    createCenter, createPlan, createIncident
  }
})
