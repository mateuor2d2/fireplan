import { defineStore } from 'pinia'

export interface ConceptodePresupuesto {
  id: number | null
  concepto: string
  tipo: string
  ud: number
  precioud: number
  amortizacion: number
  total: number
}

export interface PresupuestoSettings {
  enabledCategories: string[]
  defaultAmortization: number
  pricingRules: {
    personalProtection: {
      perWorker: boolean
      basePrice: number
    }
    collectiveProtection: {
      perPerimeter: boolean
      basePrice: number
      perimeterUnit: number
    }
  }
  autoCalculation: {
    enabled: boolean
    adjustToTarget: boolean
    rounding: string
  }
  defaultItems: ConceptodePresupuesto[]
}
interface MainInterfaceState {
  [key: string]: any // Adjust the value type (`any`) as necessary
}
interface MainInterface extends MainInterfaceState {
  presupuesto: ConceptodePresupuesto[]
  userPresupuesto: ConceptodePresupuesto[]
  adminPresupuesto: ConceptodePresupuesto[]
  tipo_conceptos: string[]
  conceptoActual: ConceptodePresupuesto
  settings: PresupuestoSettings
}
export const usePresupuestosStore = defineStore('presupuestos', {
  state: (): MainInterface => ({
    tipo_conceptos: [
      'Protecciones Personales',
      'Protecciones Colectivas',
      'Señalizaciones',
      'Medicina Preventiva',
      'Instalaciones para el personal',
      'Extinción de incendios',
      'Primeros auxilios',
      'Formación y reuniones de obligado cumplimiento'
    ],
    presupuesto: [],
    userPresupuesto: [],
    adminPresupuesto: [],
    conceptoActual: {
      id: null,
      concepto: '',
      tipo: '',
      ud: 0,
      precioud: 0,
      amortizacion: 0,
      total: 0
    },
    settings: {
      enabledCategories: [
        'Protecciones Personales',
        'Protecciones Colectivas',
        'Señalizaciones',
        'Medicina Preventiva',
        'Instalaciones para el personal',
        'Extinción de incendios',
        'Primeros auxilios',
        'Formación y reuniones de obligado cumplimiento'
      ],
      defaultAmortization: 100,
      pricingRules: {
        personalProtection: {
          perWorker: true,
          basePrice: 0
        },
        collectiveProtection: {
          perPerimeter: true,
          basePrice: 0,
          perimeterUnit: 10
        }
      },
      autoCalculation: {
        enabled: true,
        adjustToTarget: false,
        rounding: 'two-decimals'
      },
      defaultItems: []
    }
  }),
  actions: {
    // Load presupuesto defaults from database
    async inicializaPresupuesto() {
      try {
        console.log('🔍 [PRESUPUESTOS] Loading admin defaults from /api/admin/presupuesto-defaults')
        const response = await $fetch<{ data: any[] }>('/api/admin/presupuesto-defaults')
        console.log('🔍 [PRESUPUESTOS] Raw response:', response)
        const data = response?.data || []
        console.log('🔍 [PRESUPUESTOS] Admin defaults data:', data)

        if (data && data.length > 0) {
          // Transform database format to store format
          const transformedData = data.map((item: any) => ({
            id: item.id,
            concepto: item.concepto,
            tipo: item.tipo,
            ud: item.ud,
            precioud: item.precioud,
            amortizacion: 100, // Default amortization
            total: item.total
          }))

          console.log('🔍 [PRESUPUESTOS] Transformed admin defaults:', transformedData)
          this.$patch((state) => {
            state.presupuesto = transformedData
          })

          console.log('Loaded', data.length, 'presupuesto defaults from database')
        } else {
          // Fallback to empty array if no defaults found
          this.$patch((state) => {
            state.presupuesto = []
          })
          console.warn('No presupuesto defaults found in database')
        }
      } catch (error) {
        console.error('Error loading presupuesto defaults:', error)
        // Fallback to hardcoded defaults in case of error
        this.inicializaPresupuestoFallback()
      }
    },

    // Fallback method with hardcoded defaults (for error cases)
    inicializaPresupuestoFallback() {
      this.$patch((state) => {
        state.presupuesto = [
          { id: 1, concepto: 'Casco de seguridad', tipo: 'Protecciones Personales', ud: 1, precioud: 15.50, amortizacion: 100, total: 15.50 },
          { id: 2, concepto: 'Gafas de protección', tipo: 'Protecciones Personales', ud: 1, precioud: 12.30, amortizacion: 100, total: 12.30 },
          { id: 3, concepto: 'Protectores auditivos', tipo: 'Protecciones Personales', ud: 1, precioud: 8.75, amortizacion: 100, total: 8.75 },
          { id: 4, concepto: 'Mascarilla antipolvo', tipo: 'Protecciones Personales', ud: 10, precioud: 2.15, amortizacion: 100, total: 21.50 },
          { id: 5, concepto: 'Guantes de trabajo', tipo: 'Protecciones Personales', ud: 5, precioud: 3.25, amortizacion: 100, total: 16.25 },
          { id: 6, concepto: 'Calzado de seguridad', tipo: 'Protecciones Personales', ud: 1, precioud: 45.80, amortizacion: 100, total: 45.80 },
          { id: 7, concepto: 'Mono de trabajo', tipo: 'Protecciones Personales', ud: 2, precioud: 28.50, amortizacion: 100, total: 57.00 },
          { id: 8, concepto: 'Chaleco reflectante', tipo: 'Protecciones Personales', ud: 2, precioud: 12.90, amortizacion: 100, total: 25.80 },
          { id: 9, concepto: 'Arnés de seguridad', tipo: 'Protecciones Personales', ud: 1, precioud: 85.00, amortizacion: 100, total: 85.00 },
          { id: 10, concepto: 'Cuerda de seguridad', tipo: 'Protecciones Personales', ud: 50, precioud: 2.80, amortizacion: 100, total: 140.00 }
        ]
      })
      console.log('Loaded fallback presupuesto defaults')
    },
    inicializaConceptoActual() {
      this.conceptoActual = {
        concepto: '',
        tipo: '',
        ud: 0,
        precioud: 0,
        amortizacion: 0,
        total: 0,
        id: null
      }
    },
    updateConceptoPresupuestoField<K extends keyof ConceptodePresupuesto>(
      field: K,
      value: ConceptodePresupuesto[K]
    ) {
      this.conceptoActual[field] = value
    },
    updateConceptoPresupuesto(row: ConceptodePresupuesto) {
      this.conceptoActual = { ...row }
    },
    deleteElementPresupuesto(row: ConceptodePresupuesto) {
      // given an ConceptodePresupuesto, find it in the array and remove it
      this.presupuesto = this.presupuesto.filter(
        (concepto: ConceptodePresupuesto) => concepto.id !== row.id
      )
    },

    // Plan-specific presupuesto loading methods
    async getPresupuestoForPlan(planId?: string, onProgress?: (step: string) => void): Promise<ConceptodePresupuesto[]> {
      console.log('🔄 [PRESUPUESTO] Starting getPresupuestoForPlan for planId:', planId)
      if (onProgress) onProgress('checking')

      const userStore = useUserStore()
      const planesStore = usePlanesStore()
      const userSettings = userStore.user.appSettings
      const plan = planesStore.planActual

      console.log(' [PRESUPUESTO] User settings:', userSettings)
      console.log(' [PRESUPUESTO] Plan data:', {
        id: plan?._id,
        hasPresupuesto: !!plan?.presupuesto?.length,
        hasUserPresupuesto: !!plan?.userPresupuesto?.length,
        presupuestoLength: plan?.presupuesto?.length || 0,
        userPresupuestoLength: plan?.userPresupuesto?.length || 0
      })

      // Check if user has plan-specific presupuesto persistence enabled
      if (userSettings?.persistPresupuestoPerPlan && planId) {
        console.log(' [PRESUPUESTO] Plan-specific persistence enabled')
        if (onProgress) onProgress('loading-capitulos')

        // Check if plan has user-specific presupuesto data
        if (plan?.userPresupuesto && plan.userPresupuesto.length > 0) {
          if (onProgress) onProgress('loading-conceptos')
          console.log(' [PRESUPUESTO] Loading plan-specific user presupuesto for plan:', planId, 'items:', plan.userPresupuesto.length)
          return plan.userPresupuesto
        }

        // Check if plan has general presupuesto data
        if (plan?.presupuesto && plan.presupuesto.length > 0) {
          if (onProgress) onProgress('loading-conceptos')
          console.log(' [PRESUPUESTO] Loading plan general presupuesto for plan:', planId, 'items:', plan.presupuesto.length)
          return plan.presupuesto
        }
      }

      // Check if user has personalized presupuesto items
      if (userSettings?.autoLoadUserDefaults && this.userPresupuesto.length > 0) {
        if (onProgress) onProgress('building-tree')
        console.log(' [PRESUPUESTO] Loading user personalized presupuesto (no plan-specific data)', 'items:', this.userPresupuesto.length)
        return this.userPresupuesto
      }

      // Check if user has personalized presupuesto items (fallback without setting)
      if (this.userPresupuesto.length > 0) {
        if (onProgress) onProgress('building-tree')
        console.log(' [PRESUPUESTO] Loading user personalized presupuesto (fallback)', 'items:', this.userPresupuesto.length)
        return this.userPresupuesto
      }

      // Fallback to admin defaults
      if (this.adminPresupuesto.length > 0) {
        if (onProgress) onProgress('building-tree')
        console.log(' [PRESUPUESTO] Loading admin default presupuesto (no user-specific data)', 'items:', this.adminPresupuesto.length)
        return this.adminPresupuesto
      }

      // Final fallback to hardcoded defaults
      if (onProgress) onProgress('building-tree')
      console.log('Loading fallback default presupuesto')
      this.inicializaPresupuesto()
      return this.presupuesto
    },

    // Initialize plan presupuesto with defaults if empty
    initializePlanPresupuesto(planId?: string): ConceptodePresupuesto[] {
      const planesStore = usePlanesStore()
      const plan = planesStore.planActual

      if (!plan) {
        console.warn('No plan loaded, initializing store presupuesto')
        this.inicializaPresupuesto()
        return this.presupuesto
      }

      // If plan doesn't have presupuesto data, initialize it
      if (!plan.presupuesto || plan.presupuesto.length === 0) {
        console.log('Initializing plan presupuesto with defaults')
        this.inicializaPresupuesto()
        plan.presupuesto = [...this.presupuesto]
      }

      return plan.presupuesto
    },

    // User-scoped presupuesto management
    async loadUserPresupuesto(userId: string) {
      try {
        const response = await $fetch<{ data: any[] }>(`/api/users/${userId}/presupuesto`)
        const data = response?.data || []

        const transformedData = data.map((item: any) => ({
          id: item.id,
          concepto: item.concepto,
          tipo: item.tipo,
          ud: item.ud,
          precioud: item.precioud,
          amortizacion: item.amortizacion || 100,
          total: item.total
        }))

        this.$patch((state) => {
          state.userPresupuesto = transformedData
        })

        console.log('Loaded', data.length, 'user presupuesto items')
      } catch (error) {
        console.error('Error loading user presupuesto:', error)
        this.$patch((state) => {
          state.userPresupuesto = []
        })
      }
    },

    async loadAdminPresupuesto(): Promise<ConceptodePresupuesto[]> {
      try {
        console.log('🔍 [PRESUPUESTOS] Loading admin presupuesto from /api/admin/presupuesto-defaults')
        const response = await $fetch<{ success: boolean, data: any[] }>('/api/admin/presupuesto-defaults')
        console.log('🔍 [PRESUPUESTOS] Admin API response:', response)
        const data = response?.data || []
        console.log('🔍 [PRESUPUESTOS] Admin presupuesto data from API:', data.length, 'items')

        if (data && data.length > 0) {
          const transformedData = data.map((item: any) => ({
            id: item.id,
            concepto: item.concepto,
            tipo: item.tipo,
            ud: item.ud,
            precioud: item.precioud,
            amortizacion: 100,
            total: item.total
          }))

          console.log('🔍 [PRESUPUESTOS] Transformed admin data:', transformedData.length, 'items')
          this.$patch((state) => {
            state.adminPresupuesto = transformedData
          })

          console.log('✅ [PRESUPUESTOS] Loaded', data.length, 'admin presupuesto items from API')
          return transformedData
        } else {
          console.log('⚠️ [PRESUPUESTOS] No data from API, using fallback')
          return this.useFallbackPresupuesto()
        }
      } catch (error) {
        console.error('❌ [PRESUPUESTOS] Error loading admin presupuesto:', error)
        return this.useFallbackPresupuesto()
      }
    },

    useFallbackPresupuesto(): ConceptodePresupuesto[] {
      console.log('🔄 [PRESUPUESTOS] Using fallback presupuesto')
      const fallbackData = [
        { id: 1, concepto: 'Casco de seguridad', tipo: 'Protecciones Personales', ud: 1, precioud: 15.50, amortizacion: 100, total: 15.50 },
        { id: 2, concepto: 'Gafas de protección', tipo: 'Protecciones Personales', ud: 1, precioud: 12.30, amortizacion: 100, total: 12.30 },
        { id: 3, concepto: 'Protectores auditivos', tipo: 'Protecciones Personales', ud: 1, precioud: 8.75, amortizacion: 100, total: 8.75 },
        { id: 4, concepto: 'Mascarilla antipolvo', tipo: 'Protecciones Personales', ud: 10, precioud: 2.15, amortizacion: 100, total: 21.50 },
        { id: 5, concepto: 'Guantes de trabajo', tipo: 'Protecciones Personales', ud: 5, precioud: 3.25, amortizacion: 100, total: 16.25 },
        { id: 6, concepto: 'Calzado de seguridad', tipo: 'Protecciones Personales', ud: 1, precioud: 45.80, amortizacion: 100, total: 45.80 },
        { id: 7, concepto: 'Mono de trabajo', tipo: 'Protecciones Personales', ud: 2, precioud: 28.50, amortizacion: 100, total: 57.00 },
        { id: 8, concepto: 'Chaleco reflectante', tipo: 'Protecciones Personales', ud: 2, precioud: 12.90, amortizacion: 100, total: 25.80 },
        { id: 9, concepto: 'Arnés de seguridad', tipo: 'Protecciones Personales', ud: 1, precioud: 85.00, amortizacion: 100, total: 85.00 },
        { id: 10, concepto: 'Cuerda de seguridad', tipo: 'Protecciones Personales', ud: 50, precioud: 2.80, amortizacion: 100, total: 140.00 },
        { id: 11, concepto: 'Red de seguridad', tipo: 'Protecciones Colectivas', ud: 100, precioud: 4.50, amortizacion: 100, total: 450.00 },
        { id: 12, concepto: 'Barandilla de protección', tipo: 'Protecciones Colectivas', ud: 20, precioud: 15.75, amortizacion: 100, total: 315.00 },
        { id: 13, concepto: 'Malla de cerramiento', tipo: 'Protecciones Colectivas', ud: 50, precioud: 8.25, amortizacion: 100, total: 412.50 },
        { id: 14, concepto: 'Tope para camiones', tipo: 'Protecciones Colectivas', ud: 2, precioud: 125.00, amortizacion: 100, total: 250.00 },
        { id: 15, concepto: 'Plataforma de trabajo', tipo: 'Protecciones Colectivas', ud: 1, precioud: 350.00, amortizacion: 100, total: 350.00 },
        { id: 16, concepto: 'Señal de prohibición', tipo: 'Señalizaciones', ud: 5, precioud: 18.50, amortizacion: 100, total: 92.50 },
        { id: 17, concepto: 'Señal de obligación', tipo: 'Señalizaciones', ud: 8, precioud: 16.75, amortizacion: 100, total: 134.00 },
        { id: 18, concepto: 'Señal de advertencia', tipo: 'Señalizaciones', ud: 6, precioud: 19.25, amortizacion: 100, total: 115.50 },
        { id: 19, concepto: 'Cinta de balizamiento', tipo: 'Señalizaciones', ud: 200, precioud: 0.85, amortizacion: 100, total: 170.00 },
        { id: 20, concepto: 'Cono de señalización', tipo: 'Señalizaciones', ud: 10, precioud: 12.50, amortizacion: 100, total: 125.00 },
        { id: 21, concepto: 'Reconocimiento médico', tipo: 'Medicina Preventiva', ud: 1, precioud: 75.00, amortizacion: 100, total: 75.00 },
        { id: 22, concepto: 'Vacunación antitetánica', tipo: 'Medicina Preventiva', ud: 1, precioud: 25.00, amortizacion: 100, total: 25.00 },
        { id: 23, concepto: 'Botiquín de primeros auxilios', tipo: 'Medicina Preventiva', ud: 1, precioud: 45.00, amortizacion: 100, total: 45.00 },
        { id: 24, concepto: 'Vestuario y aseos', tipo: 'Instalaciones para el personal', ud: 1, precioud: 1200.00, amortizacion: 100, total: 1200.00 },
        { id: 25, concepto: 'Comedor', tipo: 'Instalaciones para el personal', ud: 1, precioud: 800.00, amortizacion: 100, total: 800.00 },
        { id: 26, concepto: 'Oficina de obra', tipo: 'Instalaciones para el personal', ud: 1, precioud: 600.00, amortizacion: 100, total: 600.00 },
        { id: 27, concepto: 'Extintor portátil', tipo: 'Extinción de incendios', ud: 3, precioud: 35.00, amortizacion: 100, total: 105.00 },
        { id: 28, concepto: 'Manguera contraincendios', tipo: 'Extinción de incendios', ud: 25, precioud: 8.50, amortizacion: 100, total: 212.50 },
        { id: 29, concepto: 'Detector de humos', tipo: 'Extinción de incendios', ud: 4, precioud: 65.00, amortizacion: 100, total: 260.00 },
        { id: 30, concepto: 'Camilla portátil', tipo: 'Primeros auxilios', ud: 1, precioud: 125.00, amortizacion: 100, total: 125.00 },
        { id: 31, concepto: 'Material de curas', tipo: 'Primeros auxilios', ud: 1, precioud: 85.00, amortizacion: 100, total: 85.00 },
        { id: 32, concepto: 'Curso de seguridad', tipo: 'Formación y reuniones de obligado cumplimiento', ud: 1, precioud: 150.00, amortizacion: 100, total: 150.00 },
        { id: 33, concepto: 'Reunión mensual de seguridad', tipo: 'Formación y reuniones de obligado cumplimiento', ud: 12, precioud: 25.00, amortizacion: 100, total: 300.00 },
        { id: 34, concepto: 'Charla de 5 minutos', tipo: 'Formación y reuniones de obligado cumplimiento', ud: 50, precioud: 5.00, amortizacion: 100, total: 250.00 },
        { id: 35, concepto: 'Formación específica', tipo: 'Formación y reuniones de obligado cumplimiento', ud: 2, precioud: 200.00, amortizacion: 100, total: 400.00 },
        { id: 36, concepto: 'Coordinador de seguridad', tipo: 'Formación y reuniones de obligado cumplimiento', ud: 1, precioud: 1500.00, amortizacion: 100, total: 1500.00 },
        { id: 37, concepto: 'Plan de seguridad y salud', tipo: 'Formación y reuniones de obligado cumplimiento', ud: 1, precioud: 800.00, amortizacion: 100, total: 800.00 },
        { id: 38, concepto: 'Libro de incidencias', tipo: 'Formación y reuniones de obligado cumplimiento', ud: 1, precioud: 15.00, amortizacion: 100, total: 15.00 }
      ]

      this.$patch((state) => {
        state.adminPresupuesto = fallbackData
        state.presupuesto = fallbackData
      })

      console.log('✅ [PRESUPUESTOS] Loaded', fallbackData.length, 'fallback presupuesto items')
      return fallbackData
    },

    async createUserPresupuestoItem(userId: string, item: Omit<ConceptodePresupuesto, 'id'>) {
      try {
        const response = await $fetch<{ data: any }>(`/api/users/${userId}/presupuesto`, {
          method: 'POST',
          body: item
        })

        const newItem = {
          id: response.data.id,
          ...item
        }

        this.$patch((state) => {
          state.userPresupuesto.push(newItem)
        })

        return newItem
      } catch (error) {
        console.error('Error creating user presupuesto item:', error)
        throw error
      }
    },

    async updateUserPresupuestoItem(userId: string, id: number, item: Partial<ConceptodePresupuesto>) {
      try {
        await $fetch(`/api/users/${userId}/presupuesto/${id}`, {
          method: 'PUT',
          body: item
        })

        this.$patch((state) => {
          const index = state.userPresupuesto.findIndex(p => p.id === id)
          if (index !== -1) {
            state.userPresupuesto[index] = { ...state.userPresupuesto[index], ...item }
          }
        })
      } catch (error) {
        console.error('Error updating user presupuesto item:', error)
        throw error
      }
    },

    async deleteUserPresupuestoItem(userId: string, id: number) {
      try {
        await $fetch(`/api/users/${userId}/presupuesto/${id}`, {
          method: 'DELETE'
        })

        this.$patch((state) => {
          state.userPresupuesto = state.userPresupuesto.filter(p => p.id !== id)
        })
      } catch (error) {
        console.error('Error deleting user presupuesto item:', error)
        throw error
      }
    },

    async resetUserPresupuestoToDefaults(userId: string) {
      try {
        await $fetch(`/api/users/${userId}/presupuesto/reset`, {
          method: 'POST'
        })

        await this.loadUserPresupuesto(userId)
        await this.loadAdminPresupuesto()
      } catch (error) {
        console.error('Error resetting user presupuesto to defaults:', error)
        throw error
      }
    },

    async copyUserPresupuestoFromDefaults(userId: string) {
      try {
        await $fetch(`/api/users/${userId}/presupuesto/copy-from-defaults`, {
          method: 'POST'
        })

        await this.loadUserPresupuesto(userId)
        await this.loadAdminPresupuesto()
      } catch (error) {
        console.error('Error copying user presupuesto from defaults:', error)
        throw error
      }
    },

    // Settings management methods
    async loadPresupuestoSettings(userId: string) {
      try {
        const response = await $fetch<{ data: PresupuestoSettings }>(`/api/users/${userId}/presupuesto/settings`)

        if (response.success) {
          this.$patch((state) => {
            state.settings = response.data
          })
          console.log('✅ [SETTINGS] Presupuesto settings loaded successfully')
        }
      } catch (error) {
        console.error('❌ [SETTINGS] Error loading presupuesto settings:', error)
        // Keep default settings if API fails
      }
    },

    async savePresupuestoSettings(userId: string, settings: Partial<PresupuestoSettings>) {
      try {
        const response = await $fetch<{ data: PresupuestoSettings }>(`/api/users/${userId}/presupuesto/settings`, {
          method: 'POST',
          body: settings
        })

        if (response.success) {
          this.$patch((state) => {
            state.settings = { ...state.settings, ...response.data }
          })
          console.log('✅ [SETTINGS] Presupuesto settings saved successfully')
        }

        return response.data
      } catch (error) {
        console.error('❌ [SETTINGS] Error saving presupuesto settings:', error)
        throw error
      }
    },

    // Apply settings to presupuesto items
    applySettingsToPresupuesto(items: ConceptodePresupuesto[], planData?: any): ConceptodePresupuesto[] {
      const settings = this.settings
      let processedItems = [...items]

      // Filter by enabled categories
      processedItems = processedItems.filter(item =>
        settings.enabledCategories.includes(item.tipo)
      )

      // Apply default amortization if not set
      processedItems = processedItems.map(item => ({
        ...item,
        amortizacion: item.amortizacion || settings.defaultAmortization
      }))

      // Apply pricing rules if plan data is available
      if (planData && settings.autoCalculation.enabled) {
        const numWorkers = parseInt(planData.num_trab_plan) || 0
        const perimetro = planData.perimetro_obra || 0

        processedItems = processedItems.map((item) => {
          const processedItem = { ...item }

          if (item.tipo === 'Protecciones Personales' && settings.pricingRules.personalProtection.perWorker) {
            processedItem.ud = numWorkers
            processedItem.precioud = Math.max(settings.pricingRules.personalProtection.basePrice, item.precioud)
          } else if (item.tipo === 'Protecciones Colectivas' && settings.pricingRules.collectiveProtection.perPerimeter) {
            const units = Math.max(1, Math.round(perimetro / settings.pricingRules.collectiveProtection.perimeterUnit))
            processedItem.ud = units
            processedItem.precioud = Math.max(settings.pricingRules.collectiveProtection.basePrice, item.precioud)
          }

          // Recalculate total
          processedItem.total = Number((processedItem.ud * processedItem.precioud).toFixed(2))

          // Apply rounding
          if (settings.autoCalculation.rounding === 'two-decimals') {
            processedItem.total = Number(processedItem.total.toFixed(2))
          } else if (settings.autoCalculation.rounding === 'nearest-euro') {
            processedItem.total = Math.round(processedItem.total)
          }

          return processedItem
        })
      }

      return processedItems
    }
  }
})
