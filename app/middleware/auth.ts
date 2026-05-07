import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore()

  // Skip middleware for public routes (no authentication required)
  if (to.path.startsWith('/public')) {
    console.log('Auth middleware: Public route, skipping authentication')
    return
  }

  // Skip middleware if already on auth pages
  if (
    to.path === '/login'
    || to.path === '/signup'
    || to.path === '/reset-password'
  ) {
    return
  }

  // Check if we have an auth token - if so, try to fetch user to ensure auth state is initialized
  const token = useCookie('auth_token')

  // If token exists but user not logged in yet, try to fetch user
  if (token.value && !userStore.loggedIn) {
    try {
      await userStore.fetchUser()
    } catch (error) {
      console.log('Auth middleware: Failed to fetch user, redirecting to login')
      return navigateTo('/login')
    }
  }

  // Check if user is logged in after potential fetch
  if (!userStore.loggedIn) {
    console.log('Auth middleware: User not logged in, redirecting to login')
    return navigateTo('/login')
  }

  console.log('Auth middleware: User logged in, allowing access to', to.path)
})
