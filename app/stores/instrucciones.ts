import { defineStore } from 'pinia'

export interface RiesgoInstruccion {
  conceptoId: string
  nombreConcepto: string
  tipoRiesgo: string
  probabilidad: string
  gravedad: string
  medidasPreventivas: string[]
  epis: string[]
  proteccionesColectivas: string[]
}

export interface FirmaInstruccion {
  userId: string
  userName: string
  rol: string
  tipoFirma: 'emisor' | 'receptor' | 'conformidad' | 'cierre'
  firmadoAt: Date
  comentario?: string
}

export interface EvidenciaInstruccion {
  id: string
  url: string
  caption?: string
  uploadedAt: Date
}

export interface Instruccion {
  id: string
  obraId: string
  titulo: string
  descripcion: string
  tarea: string
  emitidoPor: string
  emitidoPorNombre: string
  nivelEmisor: string
  asignadoA: string[]
  asignadoANombres: string[]
  riesgos: RiesgoInstruccion[]
  estado: 'borrador' | 'emitida' | 'recibida' | 'en_ejecucion' | 'completada' | 'cerrada' | 'cancelada'
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  fechaInicio: Date
  fechaFin: Date
  firmas: FirmaInstruccion[]
  evidencias: EvidenciaInstruccion[]
  comentarios: {
    id: string
    userId: string
    userName: string
    texto: string
    createdAt: Date
  }[]
  conceptosPlanIds: string[]
  referencia?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface MiniInstruccion {
  id: string
  titulo: string
  tarea: string
  estado: string
  prioridad: string
  emitidoPorNombre: string
  fechaInicio: Date
  fechaFin: Date
  referencia?: string
  riesgoCount: number
  firmaCount: number
  comentarioCount: number
}

export interface ConceptoPlan {
  id: string
  nombre: string
  descripcion: string
  medidasPreventivas: string
  evaluaciones: any[]
  epis: string[]
  proteccionesColectivas: string[]
  procedimientosColectivos: string[]
  medidasAuxiliares: string[]
  maquinaria: string[]
  capitulo: number
  capituloTitle: string
}

export const useInstruccionesStore = defineStore('instrucciones', {
  state: () => ({
    instrucciones: [] as Instruccion[],
    instruccionActual: null as Instruccion | null,
    conceptosPlan: [] as ConceptoPlan[],
    loading: false
  }),

  actions: {
    async fetchInstrucciones(obraId: string, filtros?: Record<string, string>) {
      this.loading = true
      try {
        const params: any = { obraId }
        if (filtros) {
          Object.assign(params, filtros)
        }
        const response = await $fetch('/api/instrucciones', { params })
        this.instrucciones = response.data
        return response
      } catch (error) {
        console.error('Error fetching instrucciones:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchInstruccion(id: string) {
      this.loading = true
      try {
        const response = await $fetch(`/api/instrucciones/${id}`)
        this.instruccionActual = response.data
        return response
      } catch (error) {
        console.error('Error fetching instruccion:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async crearInstruccion(data: Partial<Instruccion>) {
      try {
        const response = await $fetch('/api/instrucciones', {
          method: 'POST',
          body: data
        })
        this.instrucciones.push(response.data)
        return response.data
      } catch (error) {
        console.error('Error creating instruccion:', error)
        throw error
      }
    },

    async actualizarInstruccion(id: string, data: Partial<Instruccion>) {
      try {
        const response = await $fetch(`/api/instrucciones/${id}`, {
          method: 'PATCH',
          body: data
        })
        const idx = this.instrucciones.findIndex(i => i.id === id)
        if (idx >= 0) {
          this.instrucciones[idx] = response.data
        }
        return response.data
      } catch (error) {
        console.error('Error updating instruccion:', error)
        throw error
      }
    },

    async cambiarEstado(id: string, estado: string, userName: string, rol: string) {
      try {
        const response = await $fetch(`/api/instrucciones/${id}/estado`, {
          method: 'PATCH',
          body: { estado, userName, rol }
        })
        const idx = this.instrucciones.findIndex(i => i.id === id)
        if (idx >= 0) {
          this.instrucciones[idx] = response.data
        }
        if (this.instruccionActual?.id === id) {
          this.instruccionActual = response.data
        }
        return response.data
      } catch (error) {
        console.error('Error changing estado:', error)
        throw error
      }
    },

    async agregarComentario(id: string, texto: string, userName: string) {
      try {
        const response = await $fetch(`/api/instrucciones/${id}/comentarios`, {
          method: 'POST',
          body: { texto, userName }
        })
        if (this.instruccionActual?.id === id) {
          this.instruccionActual = response.data
        }
        return response.data
      } catch (error) {
        console.error('Error adding comentario:', error)
        throw error
      }
    },

    async fetchConceptosPlan(obraId: string) {
      try {
        const response = await $fetch('/api/instrucciones/riesgos-plan', {
          params: { obraId }
        })
        this.conceptosPlan = response.data
        return response
      } catch (error) {
        console.error('Error fetching conceptos plan:', error)
        throw error
      }
    }
  }
})
