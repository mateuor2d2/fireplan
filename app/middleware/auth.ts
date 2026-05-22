export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore()
  
  // If user is not authenticated, try to fetch user data
  if (!userStore.user) {
    try {
      await userStore.fetchUser()
    } catch (e) {
      // If fetch fails, user is not authenticated
    }
  }
  
  // If still not authenticated, redirect to login
  if (!userStore.user) {
    return navigateTo('/login')
  }
})
