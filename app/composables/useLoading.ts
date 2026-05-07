import { useUserStore } from '~/stores/user'

export function useLoading() {
  const userStore = useUserStore()

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      userStore.startLoading()
      return await fn()
    } finally {
      userStore.stopLoading()
    }
  }

  return {
    withLoading
  }
}
