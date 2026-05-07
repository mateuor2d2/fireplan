<script setup lang="ts">
// Navigation for docs sidebar is provided by the docs pages
const navigation = inject<Ref<any[]>>('navigation', ref([]))
const helpOpen = ref(false)
</script>

<template>
  <div>
    <AppHeader />

    <main>
      <UContainer>
        <UPage>
          <template #left>
            <UPageAside>
              <template #top>
                <UButton
                  label="Search"
                  variant="outline"
                  icon="i-lucide-search"
                  disabled
                />
              </template>

              <UContentNavigation
                :navigation="navigation"
                highlight
              />
            </UPageAside>
          </template>

          <slot />
        </UPage>
      </UContainer>
    </main>

    <AppFooter />

    <div class="fixed bottom-6 right-6 z-50">
      <HelpButton @click="helpOpen = true" />
    </div>
    <HelpDrawer v-model:open="helpOpen" />
  </div>
</template>
