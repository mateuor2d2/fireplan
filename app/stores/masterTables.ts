import { defineStore } from 'pinia'
import type { FetchError } from 'ofetch'
import { useUserStore } from './user'

export type MasterTableType
  = | 'tipo_concepto_unidad'
    | 'capitulo'
    | 'riesgo'
    | 'probabilidad'
    | 'gravedad'
    | 'epi'
    | 'pqs'
    | 'maq'
    | 'pcol'
    | 'medaux'

export interface MasterTableItem {
  _id?: string
  id: number
  description: string
  isDefault?: boolean
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  updatedBy?: string
  mguser?: string // User ID who owns this record
}

interface MasterTablesState {
  defaultTables: {
    [key in MasterTableType]: MasterTableItem[];
  }
  userTables: {
    [key in MasterTableType]: MasterTableItem[];
  }
  currentTable: MasterTableType | null
  isLoading: boolean
}

export const useMasterTablesStore = defineStore('masterTables', {
  state: (): MasterTablesState => ({
    defaultTables: {
      tipo_concepto_unidad: [],
      capitulo: [],
      riesgo: [],
      probabilidad: [],
      gravedad: [],
      epi: [],
      pqs: [],
      maq: [],
      pcol: [],
      medaux: []
    },
    userTables: {
      tipo_concepto_unidad: [],
      capitulo: [],
      riesgo: [],
      probabilidad: [],
      gravedad: [],
      epi: [],
      pqs: [],
      maq: [],
      pcol: [],
      medaux: []
    },
    currentTable: null,
    isLoading: false
  }),

  getters: {
    getCurrentTable: state => state.currentTable
      ? {
          default: state.defaultTables[state.currentTable],
          user: state.userTables[state.currentTable]
        }
      : null,

    getTableColumns: () => (tableType: MasterTableType) => {
      const baseColumns = [
        { id: 'id', label: 'ID', sortable: true, required: true },
        { id: 'description', label: 'Descripción', sortable: true, required: true },
        { id: 'isActive', label: 'Activo', type: 'boolean' },
        { id: 'createdAt', label: 'Creado', type: 'date' },
        { id: 'updatedAt', label: 'Actualizado', type: 'date' }
      ]

      return baseColumns
    },

    canEditDefault: () => {
      const userStore = useUserStore()
      return userStore.isAdmin // Only admin can edit default tables
    }
  },

  actions: {
    async setCurrentTable(tableType: MasterTableType) {
      this.currentTable = tableType
      await this.loadTables(tableType)
    },

    async loadTables(tableType: MasterTableType) {
      this.isLoading = true
      try {
        const userStore = useUserStore()
        if (!userStore.user?._id) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await useFetch(`/api/mastertables`, {
          query: {
            type: tableType,
            userId: userStore.user._id,
            $limit: 1000 // Get all items
          },
          headers: useRequestHeaders(['cookie'])
        })

        if (error.value) {
          console.error('Error loading tables:', error.value)
          if (error.value.statusCode === 401) {
            throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
          }
          throw new Error(error.value.message || 'Error al cargar las tablas maestras')
        }

        if (data.value) {
          this.defaultTables[tableType] = data.value.default || []
          this.userTables[tableType] = data.value.user || []
        }
      } catch (error) {
        const fetchError = error as Error
        console.error('Error loading tables:', fetchError.message)
        throw new Error(fetchError.message || 'Error al cargar las tablas maestras')
      } finally {
        this.isLoading = false
      }
    },

    async createItem(tableType: MasterTableType, item: Omit<MasterTableItem, '_id' | 'createdAt' | 'updatedAt'>) {
      try {
        const userStore = useUserStore()
        const { data, error } = await useFetch(`/api/mastertable`, {
          method: 'POST',
          body: {
            ...item,
            tableType,
            createdBy: userStore.userId,
            updatedBy: userStore.userId,
            mguser: userStore.userId
          },
          headers: useRequestHeaders(['cookie'])
        })

        if (error.value) {
          console.error('Error creating item:', error.value)
          if (error.value.statusCode === 401) {
            throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
          }
          throw new Error(error.value.message || 'Error al crear el elemento')
        }

        if (data.value) {
          this.userTables[tableType].push(data.value)
          return data.value
        }
      } catch (error) {
        const fetchError = error as Error
        console.error('Error creating item:', fetchError.message)
        throw new Error(fetchError.message || 'Error al crear el elemento')
      }
    },

    async updateItem(tableType: MasterTableType, id: string, updates: Partial<MasterTableItem>) {
      try {
        const userStore = useUserStore()
        const { data, error } = await useFetch(`/api/mastertable/${id}`, {
          method: 'PUT',
          body: {
            ...updates,
            tableType,
            updatedBy: userStore.userId
          },
          headers: useRequestHeaders(['cookie'])
        })

        if (error.value) {
          console.error('Error updating item:', error.value)
          if (error.value.statusCode === 401) {
            throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
          }
          throw new Error(error.value.message || 'Error al actualizar el elemento')
        }

        if (data.value) {
          const index = this.userTables[tableType].findIndex(item => item._id === id)
          if (index !== -1) {
            this.userTables[tableType][index] = data.value
          }
          return data.value
        }
      } catch (error) {
        const fetchError = error as Error
        console.error('Error updating item:', fetchError.message)
        throw new Error(fetchError.message || 'Error al actualizar el elemento')
      }
    },

    async deleteItem(tableType: MasterTableType, id: string) {
      try {
        const { error } = await useFetch(`/api/mastertable/${id}`, {
          method: 'DELETE',
          query: { tableType },
          headers: useRequestHeaders(['cookie'])
        })

        if (error.value) {
          console.error('Error deleting item:', error.value)
          if (error.value.statusCode === 401) {
            throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
          }
          throw new Error(error.value.message || 'Error al eliminar el elemento')
        }

        this.userTables[tableType] = this.userTables[tableType].filter(item => item._id !== id)
      } catch (error) {
        const fetchError = error as Error
        console.error('Error deleting item:', fetchError.message)
        throw new Error(fetchError.message || 'Error al eliminar el elemento')
      }
    },

    async resetToDefault(tableType: MasterTableType) {
      try {
        const { error } = await useFetch('/api/mastertable/reset', {
          method: 'POST',
          body: { tableType },
          headers: useRequestHeaders(['cookie'])
        })

        if (error.value) {
          console.error('Error resetting to default:', error.value)
          if (error.value.statusCode === 401) {
            throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
          }
          throw new Error(error.value.message || 'Error al restablecer los valores por defecto')
        }

        // Reload the tables after reset
        await this.loadTables(tableType)
      } catch (error) {
        const fetchError = error as Error
        console.error('Error resetting to default:', fetchError.message)
        throw new Error(fetchError.message || 'Error al restablecer los valores por defecto')
      }
    },

    async copyFromDefault(tableType: MasterTableType) {
      try {
        // This will copy default values to user's table
        await this.resetToDefault(tableType)
      } catch (error) {
        const fetchError = error as Error
        console.error('Error copying from default:', fetchError.message)
        throw new Error(fetchError.message || 'Error al copiar los valores por defecto')
      }
    }
  }
})
