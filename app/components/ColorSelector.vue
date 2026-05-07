<script setup lang="ts">
import { ref } from 'vue'

const appConfig = useAppConfig()
const colorMode = useColorMode()
const isOpen = ref(false)

// Color groups organized by categories
const colorGroups = {
  warm: ['red', 'orange', 'amber', 'yellow'],
  nature: ['lime', 'green', 'emerald', 'teal'],
  cool: ['sky', 'blue', 'indigo', 'violet', 'cyan'],
  special: ['purple', 'fuchsia', 'pink', 'rose']
}

// Background colors (gray scales)
const grayColors = ['slate', 'gray', 'zinc', 'neutral', 'stone']

// Get color class based on color name
function getColorClass(color: string, isGray: boolean = false) {
  if (isGray) {
    return {
      'bg-slate-500 dark:bg-slate-400': color === 'slate',
      'bg-gray-500 dark:bg-gray-400': color === 'gray',
      'bg-zinc-500 dark:bg-zinc-400': color === 'zinc',
      'bg-neutral-500 dark:bg-neutral-400': color === 'neutral',
      'bg-stone-500 dark:bg-stone-400': color === 'stone'
    }
  }

  return {
    // Warm colors
    'bg-red-500 dark:bg-red-400': color === 'red',
    'bg-orange-500 dark:bg-orange-400': color === 'orange',
    'bg-amber-500 dark:bg-amber-400': color === 'amber',
    'bg-yellow-500 dark:bg-yellow-400': color === 'yellow',
    // Nature colors
    'bg-lime-500 dark:bg-lime-400': color === 'lime',
    'bg-green-500 dark:bg-green-400': color === 'green',
    'bg-emerald-500 dark:bg-emerald-400': color === 'emerald',
    'bg-teal-500 dark:bg-teal-400': color === 'teal',
    // Cool colors
    'bg-sky-500 dark:bg-sky-400': color === 'sky',
    'bg-blue-500 dark:bg-blue-400': color === 'blue',
    'bg-indigo-500 dark:bg-indigo-400': color === 'indigo',
    'bg-violet-500 dark:bg-violet-400': color === 'violet',
    'bg-cyan-500 dark:bg-cyan-400': color === 'cyan',
    // Special colors
    'bg-purple-500 dark:bg-purple-400': color === 'purple',
    'bg-fuchsia-500 dark:bg-fuchsia-400': color === 'fuchsia',
    'bg-pink-500 dark:bg-pink-400': color === 'pink',
    'bg-rose-500 dark:bg-rose-400': color === 'rose'
  }
}

// Toggle dark mode
function toggleDarkMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Set primary color theme
function setPrimaryColor(color: string) {
  appConfig.ui.colors.primary = color
}

// Set background color theme
function setGrayColor(color: string) {
  appConfig.ui.colors.neutral = color
}

// Define items for the dropdown
const items = [
  {
    label: 'Theme Settings',
    slot: 'theme-settings'
  }
]
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Theme Customization Dropdown -->
    <UDropdownMenu
      v-model:open="isOpen"
      :items="items"
    >
      <UButton
        icon="i-heroicons-swatch"
        color="secondary"
        variant="ghost"
        aria-label="Customize theme"
      />

      <!-- Custom Theme Content -->
      <template #theme-settings>
        <div class="p-4 w-72">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-medium">
              Customize Theme
            </h3>
          </div>

          <!-- Primary Colors -->
          <div class="mb-6">
            <p class="font-medium mb-2">
              Primary Color
            </p>

            <div class="space-y-3">
              <div
                v-for="(colors, groupName) in colorGroups"
                :key="groupName"
                class="mb-2"
              >
                <p class="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">
                  {{ groupName }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="color in colors"
                    :key="color"
                    class="relative inline-block m-1"
                    :title="color"
                  >
                    <button
                      type="button"
                      class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                      @click="setPrimaryColor(color)"
                    >
                      <span
                        class="block w-6 h-6 rounded-full"
                        :class="getColorClass(color)"
                      />
                      <span class="sr-only">{{ color }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Background Colors -->
          <div>
            <p class="font-medium mb-2">
              Background Color
            </p>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="color in grayColors"
                :key="color"
                class="relative inline-block m-1"
                :title="color"
              >
                <button
                  type="button"
                  class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                  @click="setGrayColor(color)"
                >
                  <span
                    class="block w-6 h-6 rounded-full"
                    :class="getColorClass(color, true)"
                  />
                  <span class="sr-only">{{ color }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="border-t pt-3 mt-4">
            <p class="text-xs text-gray-500">
              Current: {{ appConfig.ui.colors.primary }}/{{ appConfig.ui.colors.neutral }}
            </p>
          </div>
        </div>
      </template>
    </UDropdownMenu>

    <!-- Dark Mode Toggle Button -->
    <UButton
      :icon="colorMode.value === 'dark' ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
      color="secondary"
      variant="ghost"
      aria-label="Toggle dark mode"
      @click="toggleDarkMode"
    />
  </div>
</template>

<style scoped>
.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.active {
  box-shadow: 0 0 0 2px white, 0 0 0 4px currentColor;
}
</style>
