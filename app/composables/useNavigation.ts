export const useNavigation = () => {
  const { data: navigation } = useAsyncData('navigation', () =>
    queryCollectionNavigation('docs'), {
    transform: data => data?.find((item: any) => item.path === '/docs')?.children || []
  }
  )

  return { navigation }
}
