import { ref } from 'vue'
import type { string } from 'yup'
import { useUserStore } from '@/stores/user'
import { usePlanesStore } from '@/stores/planes'
import { useConceptoStore } from '@/stores/conceptos'

// Mapping store names to their dynamic import functions
export type StoreName = 'user' | 'plan' | 'concepto'

export const useDynamicStore = async (storeName: StoreName) => {
  if (storeName === 'user') {
    return useUserStore()
  }

  if (storeName === 'plan') {
    return usePlanesStore()
  }
  if (storeName === 'concepto') {
    return useConceptoStore()
  }
}
