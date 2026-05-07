<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '~/stores/user'

const props = defineProps<{
  planId: string
}>()

const storeUser = useUserStore()
const selectedUsers = ref<string[]>([])
const message = ref('')
const sharing = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

// Mock user data - in a real app, this would come from an API
const availableUsers = ref([
  { id: 'user1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com' }
])

const filteredUsers = computed(() => {
  return availableUsers.value.filter(user =>
    !selectedUsers.value.includes(user.id)
  )
})

const selectedUserObjects = computed(() => {
  return availableUsers.value.filter(user =>
    selectedUsers.value.includes(user.id)
  )
})

const addSelectedUser = (userId: string) => {
  if (!selectedUsers.value.includes(userId)) {
    selectedUsers.value.push(userId)
  }
}

const removeSelectedUser = (userId: string) => {
  selectedUsers.value = selectedUsers.value.filter(id => id !== userId)
}

const handleShareIssues = async () => {
  if (selectedUsers.value.length === 0 || !message.value.trim()) {
    error.value = 'Please select users and enter a message'
    return
  }

  sharing.value = true
  error.value = null
  success.value = false

  try {
    // In a real implementation, this would call an API endpoint
    await new Promise(resolve => setTimeout(resolve, 1000))

    success.value = true
    message.value = ''
    selectedUsers.value = []

    // Reset success message after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = 'Failed to share issues'
    console.error('Error sharing issues:', err)
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <div>
    <div class="space-y-4">
      <!-- Success message -->
      <div
        v-if="success"
        class="p-3 bg-green-50 border border-green-200 rounded text-green-700"
      >
        Issues shared successfully!
      </div>

      <!-- Error message -->
      <div
        v-if="error"
        class="p-3 bg-red-50 border border-red-200 rounded text-red-700"
      >
        {{ error }}
      </div>

      <!-- User selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Share with:
        </label>
        <div class="flex flex-wrap gap-2 mb-2">
          <UBadge
            v-for="user in selectedUserObjects"
            :key="user.id"
            color="primary"
            variant="solid"
            size="sm"
            class="flex items-center gap-1"
          >
            {{ user.name }}
            <UButton
              icon="i-heroicons-x-mark"
              color="neutral"
              variant="link"
              size="xs"
              class="p-0"
              @click="removeSelectedUser(user.id)"
            />
          </UBadge>
          <USelectMenu
            :items="filteredUsers"
            option-attribute="name"
            value-attribute="id"
            placeholder="Select users..."
            size="sm"
            class="w-40"
            @select="addSelectedUser"
          >
            <template #trailing="{ option }">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  {{ option.name.charAt(0) }}
                </div>
                <div>
                  <div class="text-sm font-medium">
                    {{ option.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ option.email }}
                  </div>
                </div>
              </div>
            </template>
          </USelectMenu>
        </div>
      </div>

      <!-- Message input -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Message:
        </label>
        <UTextarea
          v-model="message"
          placeholder="Add a message to your shared issues..."
          :rows="3"
        />
      </div>

      <!-- Share button -->
      <div class="flex justify-end">
        <UButton
          icon="i-heroicons-paper-airplane"
          color="primary"
          :loading="sharing"
          :disabled="selectedUsers.length === 0 || !message.trim()"
          @click="handleShareIssues"
        >
          Share Issues
        </UButton>
      </div>
    </div>
  </div>
</template>
