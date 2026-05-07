export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()

  // Check if user is already authenticated by trying to fetch user data
  try {
    const token = useCookie('auth_token')
    if (token.value) {
      // Set the access token in the store
      userStore.setAccesstoken(token.value)
      // Fetch user data from server
      await userStore.fetchUser()
    }
  } catch (error) {
    // If fetching user fails, clear any invalid tokens
    console.log('Auth initialization failed:', error)
    const cookie = useCookie('auth_token')
    cookie.value = null
    userStore.$reset()
  }
})
