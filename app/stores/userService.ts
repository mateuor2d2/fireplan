import { useUserStore } from './user'

export function getCurrentUser() {
  const userstore = useUserStore()
  return userstore.user
}

// Function to set the current user
export function setCurrentUser(user: any) { // Replace 'any' with your user type
  const userstore = useUserStore()
  userstore.user = user
}
// export function incrementOperations() {
//   const userstore = useUserStore();
//   userstore.incrementOperations();
// }
// export function decrementOperations(){
//   const userstore = useUserStore();
//   userstore.decrementOperations();
// }
