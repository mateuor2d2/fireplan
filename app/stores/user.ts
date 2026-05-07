import { defineStore } from 'pinia'

interface RegisterPayload {
  email: string
  password: string
  name: string
  m_cif?: string
  m_nombre?: string
  m_dir?: string
  m_pob?: string
  m_cp?: string
  m_tel?: string
  m_contacto?: string
  m_obs?: string
  precioPSS?: number
}

interface updatePayload {
  m_cif: string
  m_nombre: string
  m_dir: string
  m_pob: string
  m_cp: string
  m_tel: string
  m_contacto_nombre: string
  m_contacto_apellido: string
  m_obs: string
}

export interface FeathersResponse<T> {
  limit: number
  skip: number
  total: number
  data: T // Generic type to represent the expected data
}

interface Authentication {
  iat: number
  exp: number
  aud: string
  sub: string
  jti: string
}

export interface FeathersResponseAuthentication {
  accessToken: string
  loggedIn: boolean
  user: User
}

interface Login {
  email: string
  password: string
  accessToken: string
}

interface MatrizContacto {
  nombre: string | undefined
  apellido: string | undefined
}

export interface AppSettings {
  persistCapitulosPerPlan: boolean // Whether to persist capitulos per plan
  persistPartidasPerPlan: boolean // Whether to persist partidas per plan
  persistPresupuestoPerPlan: boolean // Whether to persist presupuesto per plan
  autoLoadUserDefaults: boolean // Whether to auto-load user defaults when no plan-specific data exists
  defaultPrintingTemplate?: string // Default printing template value/id for this user
}

export interface QRSettings {
  autoGenerate: boolean
  baseUrl: string
  expirationDays: 30 | 90 | 180 | 360 | 720 | 1080 | 1440
}

export interface User {
  _id: string
  name?: string
  email: string
  role: string
  ttl?: string
  created?: string
  accessToken?: string
  matriz_cif?: string
  matriz_nombre?: string
  matriz_dir?: string
  matriz_pob?: string
  matriz_cp?: string
  matriz_tel?: string
  matriz_obs?: string
  matriz_contacto?: MatrizContacto
  precioPSS?: number
  appSettings?: AppSettings // User's app preferences
  qrSettings?: QRSettings // User's QR code preferences
  // User's default data for fallback when no plan-specific data exists
  userDefaultCapitulos?: any[] // User's custom default capitulos
  userDefaultPartidas?: any[] // User's custom default partidas
  userDefaultPresupuesto?: any[] // User's custom default presupuesto concepts
}

interface userState {
  [key: string]: any // Adjust the value type (`any`) as necessary
}

interface State extends userState {
  ongoingOperations: number
  isLoading: boolean
  sidebar: boolean
  loggedIn: boolean
  user: User
}

export const useUserStore = defineStore('user', {
  state: (): State => ({
    ongoingOperations: 0,
    isLoading: false,
    sidebar: false,
    loggedIn: false,
    user: {
      _id: '',
      name: '',
      email: '',
      role: '',
      ttl: '',
      created: '',
      accessToken: '',
      matriz_cif: '',
      matriz_nombre: '',
      matriz_dir: '',
      matriz_pob: '',
      matriz_cp: '',
      matriz_tel: '',
      matriz_obs: '',
      matriz_contacto: {
        nombre: '',
        apellido: ''
      },
      precioPSS: 99,
      appSettings: {
        persistCapitulosPerPlan: true, // Default: persist capitulos per plan
        persistPartidasPerPlan: true, // Default: persist partidas per plan
        persistPresupuestoPerPlan: false, // Default: use global presupuesto
        autoLoadUserDefaults: true, // Default: auto-load user defaults
        defaultPrintingTemplate: '' // Default printing template value/id
      }
    }
  }),

  getters: {
    getAccessToken(): string {
      return this.user.accessToken || ''
    }
  },

  actions: {
    startLoading() {
      this.ongoingOperations++
      this.isLoading = true
    },

    async updateUser(userData: Partial<User>) {
      this.startLoading()
      try {
        const data = await $fetch<User>('/api/auth/me', {
          method: 'PUT',
          body: userData
        })
        this.setUser(data)
        return data
      } catch (error: any) {
        throw new Error(error.data?.message || error.message || 'Failed to update user')
      } finally {
        this.stopLoading()
      }
    },

    async updateAppSettings(settings: Partial<AppSettings>) {
      this.startLoading()
      try {
        const updatedSettings = { ...this.user.appSettings, ...settings }
        const data = await $fetch<User>('/api/auth/me', {
          method: 'PUT',
          body: { appSettings: updatedSettings }
        })
        this.setUser(data)
        return data
      } catch (error: any) {
        throw new Error(error.data?.message || error.message || 'Failed to update app settings')
      } finally {
        this.stopLoading()
      }
    },

    async changePassword(currentPassword: string, newPassword: string) {
      this.startLoading()
      try {
        await $fetch('/api/auth/change-password', {
          method: 'POST',
          body: { currentPassword, newPassword }
        })
        return true
      } catch (error: any) {
        throw new Error(error.data?.message || error.message || 'Failed to change password')
      } finally {
        this.stopLoading()
      }
    },

    stopLoading() {
      this.ongoingOperations--
      if (this.ongoingOperations <= 0) {
        this.ongoingOperations = 0
        this.isLoading = false
      }
    },

    setUser(user: any) {
      this.user = { ...this.user, ...user }
    },

    setAccesstoken(token: string) {
      this.user.accessToken = token
    },

    async login(email: string, password: string) {
      this.startLoading()
      try {
        const data = await $fetch<{ user: User, token: string }>(
          '/api/auth/login',
          {
            method: 'POST',
            body: { email, password }
          }
        )

        this.setUser(data.user)
        this.setAccesstoken(data.token)
        this.loggedIn = true
        return data.user
      } catch (error: any) {
        throw new Error(error.data?.message || error.message || 'Login failed')
      } finally {
        this.stopLoading()
      }
    },

    async register(payload: RegisterPayload) {
      this.startLoading()
      try {
        const data = await $fetch<{ user: User, token: string }>(
          '/api/auth/signup',
          {
            method: 'POST',
            body: payload
          }
        )

        this.setUser(data.user)
        this.setAccesstoken(data.token)
        this.loggedIn = true
        return data.user
      } catch (error: any) {
        throw new Error(
          error.data?.message || error.message || 'Registration failed'
        )
      } finally {
        this.stopLoading()
      }
    },

    async fetchUser() {
      try {
        const data = await $fetch<User>('/api/auth/me')
        this.setUser(data)
        this.loggedIn = true
        return data
      } catch (error) {
        this.logout()
        throw error
      }
    },

    async forgotPassword(email: string) {
      this.startLoading()
      try {
        const data = await $fetch<{ success: boolean }>(
          '/api/auth/forgot-password',
          {
            method: 'POST',
            body: { email }
          }
        )

        return data
      } catch (error: any) {
        throw new Error(
          error.data?.message || error.message || 'Failed to send reset email'
        )
      } finally {
        this.stopLoading()
      }
    },

    async updateUserDefaults(defaults: {
      userDefaultCapitulos?: any[]
      userDefaultPartidas?: any[]
      userDefaultPresupuesto?: any[]
    }) {
      this.startLoading()
      try {
        const data = await $fetch<User>('/api/auth/me', {
          method: 'PUT',
          body: defaults
        })
        this.setUser(data)
        return data
      } catch (error: any) {
        throw new Error(error.data?.message || error.message || 'Failed to update user defaults')
      } finally {
        this.stopLoading()
      }
    },

    // Get user's default capitulos with fallback to empty array
    getUserDefaultCapitulos(): any[] {
      return this.user.userDefaultCapitulos || []
    },

    // Get user's default partidas with fallback to empty array
    getUserDefaultPartidas(): any[] {
      return this.user.userDefaultPartidas || []
    },

    // Get user's default presupuesto with fallback to empty array
    getUserDefaultPresupuesto(): any[] {
      return this.user.userDefaultPresupuesto || []
    },

    // QR Settings Methods
    async getQRSettings(): Promise<QRSettings> {
      try {
        const response = await $fetch<{ success: boolean, data: QRSettings }>('/api/user/qr-settings')
        if (response.success && response.data) {
          // Update local user store with fetched QR settings
          this.user.qrSettings = response.data
          return response.data
        }
        // Return defaults if API fails
        return {
          autoGenerate: true,
          baseUrl: 'http://localhost:3000',
          expirationDays: 30
        }
      } catch (error) {
        console.error('Failed to fetch QR settings:', error)
        // Return defaults on error
        return {
          autoGenerate: true,
          baseUrl: 'http://localhost:3000',
          expirationDays: 30
        }
      }
    },

    async updateQRSettings(settings: Partial<QRSettings>): Promise<QRSettings> {
      this.startLoading()
      try {
        // Send only the fields required by the API schema
        const payload = {
          baseUrl: settings.baseUrl,
          autoGenerate: settings.autoGenerate,
          expirationDays: settings.expirationDays
        }

        const response = await $fetch<{ success: boolean, data: any }>('/api/user/qr-settings', {
          method: 'PUT',
          body: payload
        })

        if (response.success && response.data) {
          // Merge with existing QR settings to preserve createdAt/updatedAt
          const mergedSettings = {
            ...this.user.qrSettings,
            ...response.data,
            // Ensure we have the timestamps from server response or keep existing
            createdAt: response.data.createdAt || this.user.qrSettings?.createdAt || new Date(),
            updatedAt: response.data.updatedAt || new Date()
          }

          // Update local user store with new QR settings
          this.user.qrSettings = mergedSettings
          return mergedSettings
        }

        throw new Error('Failed to update QR settings')
      } catch (error: any) {
        throw new Error(error.data?.message || error.message || 'Failed to update QR settings')
      } finally {
        this.stopLoading()
      }
    },

    // Get user's QR settings with fallback to defaults
    getUserQRSettings(): QRSettings {
      return this.user.qrSettings || {
        autoGenerate: true,
        baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        expirationDays: 30
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST'
        })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear the auth cookie
        const cookie = useCookie('auth_token')
        cookie.value = null

        // Reset store state
        this.$reset()
        await navigateTo('/login')
      }
    }
  }
})
