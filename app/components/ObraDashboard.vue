<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useIssuesStore } from '~/stores/issues'
import { useUserStore } from '~/stores/user'
import type { Issue, MiniIssue } from '~/stores/issues'

interface Props {
  obraId: string
  obraName: string
  accessType?: 'auth' | 'qr-token'
  qrSlug?: string
  qrAccessToken?: string
}

const props = withDefaults(defineProps<Props>(), {
  accessType: 'auth',
  qrSlug: '',
  qrAccessToken: ''
})

// Stores
const issuesStore = useIssuesStore()
const userStore = useUserStore()

// State
const issues = ref<MiniIssue[]>([])
const loading = ref(false)
const isModalOpen = ref(false)
const currentIssue = ref<Issue | null>(null)
const isEditing = ref(false)
const newIssue = ref<{
  title: string
  description: string
  type: 'annotation' | 'comment' | 'accident'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  assignedTo: string[]
}>({
  title: '',
  description: '',
  type: 'annotation',
  priority: 'medium',
  status: 'open',
  assignedTo: []
})

// File upload
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const tempPhotos = ref<Array<{ url: string, caption?: string, id: string }>>([])

// New comment
const newComment = ref('')

// Delete comment modal
const showDeleteCommentModal = ref(false)
const commentToDelete = ref<string | null>(null)

// Filtering
const filters = ref({
  status: [] as string[],
  type: [] as string[],
  priority: [] as string[],
  assignedTo: [] as string[]
})
const filterDebounceTimer = ref<NodeJS.Timeout | null>(null)

// Issue management
const availableStatuses = [
  { label: 'Abierto', value: 'open' },
  { label: 'En Progreso', value: 'in-progress' },
  { label: 'Resuelto', value: 'resolved' },
  { label: 'Cerrado', value: 'closed' }
]

const projectUsers = ref<Array<{ label: string, value: string }>>([])
const notifications = ref<Array<{
  id: string
  type: 'status' | 'assignment' | 'comment'
  message: string
  timestamp: Date
  read: boolean
}>>([])

// Change history
const changeHistory = ref<Array<{
  id: string
  field: string
  oldValue: any
  newValue: any
  changedBy: string
  timestamp: Date
}>>([])

// Computed
const currentUser = computed(() => userStore.user)

// Filter computed
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.status.length > 0) count++
  if (filters.value.type.length > 0) count++
  if (filters.value.priority.length > 0) count++
  if (filters.value.assignedTo.length > 0) count++
  return count
})

// Methods
function onFiltersChange() {
  // Clear existing timer
  if (filterDebounceTimer.value) {
    clearTimeout(filterDebounceTimer.value)
  }

  // Set new timer (debounce for 500ms)
  filterDebounceTimer.value = setTimeout(() => {
    loadIssues()
  }, 500)
}

function clearFilters() {
  filters.value = {
    status: [],
    type: [],
    priority: [],
    assignedTo: []
  }
  loadIssues()
}

async function exportIssues(format: 'csv' | 'pdf' = 'csv') {
  try {
    const params = new URLSearchParams({
      obraId: props.obraId,
      format
    })

    // Add filters if active
    if (filters.value.status.length > 0) {
      filters.value.status.forEach(s => params.append('status', s))
    }
    if (filters.value.type.length > 0) {
      filters.value.type.forEach(t => params.append('type', t))
    }
    if (filters.value.priority.length > 0) {
      filters.value.priority.forEach(p => params.append('priority', p))
    }
    if (filters.value.assignedTo.length > 0) {
      filters.value.assignedTo.forEach(a => params.append('assignedTo', a))
    }

    if (format === 'csv') {
      // Open CSV download in new window
      window.open(`/api/issues/export?${params.toString()}`, '_blank')
    } else if (format === 'pdf') {
      // For PDF, fetch data and trigger download
      const response = await $fetch(`/api/issues/export?${params.toString()}`)
      const data = await response.json()

      // For now, just show the JSON data
      // In production, this would generate a PDF file
      console.log('PDF export data:', data)

      useToast().add({
        title: 'Exportación PDF',
        description: 'Los datos han sido preparados para exportar',
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Export error:', error)

    const errorMessage = error.response?._data?.message || error.message || 'No se pudo exportar'

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  }
}

async function loadIssues() {
  loading.value = true
  try {
    let response: any

    // Check if filters are active
    const hasActiveFilters = activeFilterCount.value > 0

    if (hasActiveFilters) {
      // Use filtered list endpoint
      const params: any = {
        obraId: props.obraId
      }

      if (filters.value.status.length > 0) {
        params.status = filters.value.status
      }
      if (filters.value.type.length > 0) {
        params.type = filters.value.type
      }
      if (filters.value.priority.length > 0) {
        params.priority = filters.value.priority
      }
      if (filters.value.assignedTo.length > 0) {
        params.assignedTo = filters.value.assignedTo
      }

      response = await $fetch('/api/issues/list', {
        method: 'GET',
        params
      })
    } else if (props.accessType === 'qr-token' && props.qrAccessToken) {
      // Use public API for QR token access
      response = await $fetch('/api/public/issues', {
        method: 'GET',
        query: {
          obraId: props.obraId,
          qrToken: props.qrAccessToken
        }
      })
    } else {
      // Use authenticated API
      response = await issuesStore.fetchIssues(props.obraId)
    }

    issues.value = response.data.map((issue: any): MiniIssue => ({
      id: issue.id || issue._id,
      title: issue.title,
      type: issue.type,
      status: issue.status,
      priority: issue.priority,
      createdBy: issue.createdBy,
      createdAt: issue.createdAt,
      photoCount: issue.photoCount || issue.photos?.length || 0,
      commentCount: issue.commentCount || issue.comments?.length || 0
    }))
  } catch (error) {
    console.error('Error loading issues:', error)
  } finally {
    loading.value = false
  }
}

function openCreateIssueModal() {
  // Reset form data
  newIssue.value = {
    title: '',
    description: '',
    type: 'annotation',
    priority: 'medium',
    assignedTo: []
  }
  currentIssue.value = null
  isEditing.value = false
  tempPhotos.value = []

  // Open modal
  isModalOpen.value = true
}

async function createIssue() {
  if (!newIssue.value.title) return

  try {
    const issueData = {
      ...newIssue.value,
      obraId: props.obraId,
      createdBy: currentUser.value?._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: [],
      comments: []
    }

    await issuesStore.createIssue(issueData)
    await loadIssues()
    isModalOpen.value = false
  } catch (error) {
    console.error('Error creating issue:', error)
  }
}

async function viewIssue(issueId: string, editMode = false) {
  try {
    // Load full issue details
    let response: any

    if (props.accessType === 'qr-token' && props.qrAccessToken) {
      // Use public API for QR token access
      response = await $fetch(`/api/public/issues/${issueId}`, {
        method: 'GET',
        query: {
          qrToken: props.qrAccessToken
        }
      })
    } else {
      // Use authenticated API
      response = await $fetch(`/api/issues/${issueId}`)
    }

    // Ensure the currentIssue has the correct id field
    currentIssue.value = {
      ...response.data,
      id: response.data._id || response.data.id
    }
    isEditing.value = editMode

    // Open modal
    isModalOpen.value = true
  } catch (error) {
    console.error('Error loading issue:', error)
  }
}

async function uploadPhoto(issueId: string) {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    await issuesStore.uploadPhoto(issueId, selectedFile.value)
    await loadIssues()
    selectedFile.value = null
  } catch (error) {
    console.error('Error uploading photo:', error)
  } finally {
    uploading.value = false
  }
}

async function uploadNewPhoto() {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    // For new issues, we'll add the photo to a temporary array
    // This will be handled during issue creation
    const photoId = Date.now().toString()
    tempPhotos.value.push({
      id: photoId,
      url: `/api/temp-photos/${photoId}`, // This would be a temporary URL
      caption: selectedFile.value.name
    })
    selectedFile.value = null
  } catch (error) {
    console.error('Error uploading photo:', error)
  } finally {
    uploading.value = false
  }
}

function startEdit() {
  if (!currentIssue.value) return

  // Populate form with current issue data
  newIssue.value = {
    title: currentIssue.value.title,
    description: currentIssue.value.description,
    type: currentIssue.value.type,
    priority: currentIssue.value.priority,
    assignedTo: currentIssue.value.assignedTo || []
  }

  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  // Reset form to avoid showing stale data
  newIssue.value = {
    title: '',
    description: '',
    type: 'annotation',
    priority: 'medium',
    status: 'open',
    assignedTo: []
  }
}

// Status Management Functions
function getStatusClass(status: string) {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800'
    case 'in-progress': return 'bg-yellow-100 text-yellow-800'
    case 'resolved': return 'bg-green-100 text-green-800'
    case 'closed': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'primary'
    case 'in-progress': return 'warning'
    case 'resolved': return 'success'
    case 'closed': return 'neutral'
    default: return 'neutral'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'open': return 'Abierto'
    case 'in-progress': return 'En Progreso'
    case 'resolved': return 'Resuelto'
    case 'closed': return 'Cerrado'
    default: return status
  }
}

function getAssignedUser(assignedTo: string[] | undefined) {
  if (!assignedTo || assignedTo.length === 0) return 'Sin asignar'
  const user = projectUsers.value.find(u => u.value === assignedTo[0])
  return user?.label || assignedTo[0]
}

function canChangeStatus(currentStatus: string, newStatus: string): boolean {
  // Define valid status transitions
  const validTransitions: Record<string, string[]> = {
    'open': ['in-progress', 'closed'],
    'in-progress': ['resolved', 'open', 'closed'],
    'resolved': ['closed', 'in-progress'],
    'closed': ['open'] // Allow reopening closed issues
  }

  // Check if user has permission (admin or creator can change any status)
  const hasPermission = currentUser.value?.role === 'admin'
    || currentUser.value?._id === currentIssue.value?.createdBy

  if (!hasPermission) return false

  return validTransitions[currentStatus]?.includes(newStatus) || false
}

async function changeStatus(newStatus: string) {
  if (!currentIssue.value || !canChangeStatus(currentIssue.value.status, newStatus)) return

  try {
    const oldStatus = currentIssue.value.status

    // Update issue status via dedicated endpoint
    const response = await $fetch(`/api/issues/${currentIssue.value.id}/status`, {
      method: 'PATCH',
      body: { status: newStatus }
    })

    if (response.success) {
      currentIssue.value.status = newStatus

      // Add to change history
      addToHistory('status', oldStatus, newStatus)

      // Create notification
      createNotification('status', `Estado cambiado de "${getStatusText(oldStatus)}" a "${getStatusText(newStatus)}"`)

      // Reload issues list
      await loadIssues()

      // Show success toast
      useToast().add({
        title: 'Estado actualizado',
        description: `El issue ahora está "${getStatusText(newStatus)}"`,
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error changing status:', error)

    // Show specific error message
    const errorMessage = error.response?._data?.message || error.message || 'No se pudo cambiar el estado del issue'

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  }
}

// Assignment Functions
async function assignToUsers(userIds: string[]) {
  if (!currentIssue.value) return

  try {
    const oldAssigned = [...(currentIssue.value.assignedTo || [])]

    // Update assignment via dedicated endpoint
    const response = await $fetch(`/api/issues/${currentIssue.value.id}/assign`, {
      method: 'PATCH',
      body: { assignedTo: userIds }
    })

    if (response.success) {
      currentIssue.value.assignedTo = userIds

      // Add to change history
      addToHistory('assignedTo', oldAssigned, userIds)

      // Update project users with coordinator details from response
      if (response.data.coordinators) {
        const newCoordinators = response.data.coordinators.map((c: any) => ({
          label: c.name,
          value: c.id
        }))

        // Merge with existing project users (avoid duplicates)
        const existingIds = projectUsers.value.map(u => u.value)
        const newUsers = newCoordinators.filter((c: any) => !existingIds.includes(c.value))

        projectUsers.value = [...projectUsers.value, ...newUsers]
      }

      // Create notification
      if (userIds.length > 0) {
        const userNames = userIds.map((id) => {
          const user = projectUsers.value.find(u => u.value === id)
          return user?.label || id
        }).join(', ')
        createNotification('assignment', `Issue asignado a: ${userNames}`)
      } else {
        createNotification('assignment', 'Asignación eliminada')
      }

      // Reload issues list
      await loadIssues()

      useToast().add({
        title: 'Asignación actualizada',
        description: userIds.length > 0 ? 'Issue asignado correctamente' : 'Asignación eliminada',
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error assigning users:', error)

    // Show specific error message
    const errorMessage = error.response?._data?.message || error.message || 'No se pudo actualizar la asignación'

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  }
}

// Notification Functions
function createNotification(type: 'status' | 'assignment' | 'comment', message: string) {
  const notification = {
    id: Date.now().toString(),
    type,
    message,
    timestamp: new Date(),
    read: false
  }

  notifications.value.unshift(notification)

  // Keep only last 50 notifications
  if (notifications.value.length > 50) {
    notifications.value = notifications.value.slice(0, 50)
  }

  // Show toast for immediate notification
  useToast().add({
    title: type === 'status' ? 'Cambio de Estado' : type === 'assignment' ? 'Asignación' : 'Comentario',
    description: message
  })
}

// Change History Functions
function addToHistory(field: string, oldValue: any, newValue: any) {
  const historyEntry = {
    id: Date.now().toString(),
    field,
    oldValue,
    newValue,
    changedBy: currentUser.value?.name || 'Usuario',
    timestamp: new Date()
  }

  changeHistory.value.unshift(historyEntry)

  // Keep only last 100 history entries
  if (changeHistory.value.length > 100) {
    changeHistory.value = changeHistory.value.slice(0, 100)
  }
}

// Permission Functions
function canEditIssue(): boolean {
  if (!currentIssue.value) return true // Can always create new issues

  return currentUser.value?.role === 'admin'
    || currentUser.value?._id === currentIssue.value.createdBy
    || currentIssue.value.assignedTo?.includes(currentUser.value?._id || '')
}

function canViewIssue(): boolean {
  if (!currentIssue.value) return true

  // All project members can view issues
  return true
}

// Load project users
async function loadProjectUsers() {
  try {
    // This would typically come from an API call to get project members
    // For now, we'll create some mock users
    projectUsers.value = [
      { label: currentUser.value?.name || 'Yo', value: currentUser.value?._id || '' },
      { label: 'Juan Pérez', value: 'user1' },
      { label: 'María García', value: 'user2' },
      { label: 'Carlos López', value: 'user3' }
    ]
  } catch (error) {
    console.error('Error loading project users:', error)
  }
}

// History formatting functions
function formatHistoryAction(change: any) {
  switch (change.field) {
    case 'status': return 'cambió el estado'
    case 'assignedTo': return 'cambió la asignación'
    case 'comment': return 'comentó'
    case 'title': return 'cambió el título'
    case 'description': return 'cambió la descripción'
    case 'priority': return 'cambió la prioridad'
    case 'type': return 'cambió el tipo'
    default: return 'modificó'
  }
}

function formatHistoryValue(change: any) {
  if (change.field === 'comment') {
    return `"${change.newValue.text}"`
  }

  if (change.field === 'status') {
    return `de "${getStatusText(change.oldValue)}" a "${getStatusText(change.newValue)}"`
  }

  if (change.field === 'assignedTo') {
    const oldNames = (change.oldValue || []).map((id: string) => {
      const user = projectUsers.value.find(u => u.value === id)
      return user?.label || id
    }).join(', ') || 'nadie'

    const newNames = (change.newValue || []).map((id: string) => {
      const user = projectUsers.value.find(u => u.value === id)
      return user?.label || id
    }).join(', ') || 'nadie'

    return `de "${oldNames}" a "${newNames}"`
  }

  if (change.oldValue !== undefined && change.newValue !== undefined) {
    return `de "${change.oldValue}" a "${change.newValue}"`
  }

  return change.newValue || ''
}

function formatHistoryTime(timestamp: Date) {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  if (hours < 24) return `hace ${hours} h`
  if (days < 7) return `hace ${days} días`

  return timestamp.toLocaleDateString()
}

async function loadIssueHistory() {
  if (!currentIssue.value) return

  try {
    // This would typically load history from an API
    // For now, we'll just show what we have in the local history
    console.log('Loading issue history for:', currentIssue.value.id)
  } catch (error) {
    console.error('Error loading issue history:', error)
  }
}

async function updateIssue() {
  if (!currentIssue.value || !newIssue.value.title) return

  try {
    const updatedData = {
      title: newIssue.value.title,
      description: newIssue.value.description,
      type: newIssue.value.type,
      priority: newIssue.value.priority,
      status: newIssue.value.status,
      assignedTo: newIssue.value.assignedTo
    }

    // Track changes for history
    const oldData = {
      title: currentIssue.value.title,
      description: currentIssue.value.description,
      type: currentIssue.value.type,
      priority: currentIssue.value.priority,
      status: currentIssue.value.status,
      assignedTo: currentIssue.value.assignedTo
    }

    await issuesStore.updateIssue(currentIssue.value.id, updatedData)

    // Update local currentIssue with new data
    currentIssue.value = { ...currentIssue.value, ...updatedData }

    // Add changes to history
    Object.keys(updatedData).forEach((field) => {
      if (oldData[field as keyof typeof oldData] !== updatedData[field as keyof typeof updatedData]) {
        addToHistory(field, oldData[field as keyof typeof oldData], updatedData[field as keyof typeof updatedData])
      }
    })

    // Create notification for significant changes
    if (oldData.status !== updatedData.status) {
      createNotification('status', `Estado cambiado a "${getStatusText(updatedData.status)}"`)
    }

    if (JSON.stringify(oldData.assignedTo) !== JSON.stringify(updatedData.assignedTo)) {
      const userNames = updatedData.assignedTo.map((id) => {
        const user = projectUsers.value.find(u => u.value === id)
        return user?.label || id
      }).join(', ')
      createNotification('assignment', updatedData.assignedTo.length > 0 ? `Asignado a: ${userNames}` : 'Asignación eliminada')
    }

    // Reload issues list
    await loadIssues()

    // Exit edit mode but keep modal open
    isEditing.value = false

    useToast().add({
      title: 'Issue actualizado',
      description: 'Los cambios han sido guardados correctamente',
      color: 'success'
    })
  } catch (error) {
    console.error('Error updating issue:', error)
    useToast().add({
      title: 'Error',
      description: 'No se pudo actualizar el issue',
      color: 'error'
    })
  }
}

async function addComment() {
  if (!newComment.value || !currentIssue.value) return

  try {
    // Add comment via dedicated endpoint
    const response = await $fetch(`/api/issues/${currentIssue.value.id}/comments`, {
      method: 'POST',
      body: { text: newComment.value }
    })

    if (response.success) {
      // Add comment to local issue
      const commentData = response.data

      if (!currentIssue.value.comments) {
        currentIssue.value.comments = []
      }

      currentIssue.value.comments = [
        ...currentIssue.value.comments,
        commentData
      ]

      // Add to change history
      addToHistory('comment', null, {
        text: commentData.text,
        userName: commentData.userName
      })

      // Create notification
      createNotification('comment', `${commentData.userName} comentó: "${commentData.text}"`)

      // Clear comment input
      newComment.value = ''

      useToast().add({
        title: 'Comentario añadido',
        description: 'Tu comentario ha sido publicado',
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error adding comment:', error)

    const errorMessage = error.response?._data?.message || error.message || 'No se pudo añadir el comentario'

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  }
}

async function deleteComment(commentId: string) {
  if (!currentIssue.value) return

  try {
    // Delete comment via dedicated endpoint
    const response = await $fetch(`/api/issues/${currentIssue.value.id}/comments/${commentId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // Remove comment from local issue
      currentIssue.value.comments = currentIssue.value.comments.filter(c => c.id !== commentId)

      // Reload issues list to update counts
      await loadIssues()

      useToast().add({
        title: 'Comentario eliminado',
        description: 'El comentario ha sido eliminado',
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error deleting comment:', error)

    const errorMessage = error.response?._data?.message || error.message || 'No se pudo eliminar el comentario'

    useToast().add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  }
}

function confirmDeleteComment() {
  if (commentToDelete.value && currentIssue.value) {
    deleteComment(commentToDelete.value)
    showDeleteCommentModal.value = false
    commentToDelete.value = null
  }
}

function promptDeleteComment(commentId: string) {
  commentToDelete.value = commentId
  showDeleteCommentModal.value = true
}

function canDeleteComment(comment: any): boolean {
  if (!currentUser.value) return false

  // User can delete their own comments
  if (comment.userId === currentUser.value._id.toString()) return true

  // Admins can delete any comment
  if (currentUser.value.role === 'admin') return true

  return false
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'accident': return 'i-lucide-alert-triangle'
    case 'comment': return 'i-lucide-message-circle'
    default: return 'i-lucide-sticky-note'
  }
}

// Lifecycle
onMounted(() => {
  loadIssues()
  loadProjectUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold">
        Dashboard: {{ obraName }}
      </h2>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="openCreateIssueModal"
      >
        Nuevo Issue
      </UButton>
    </div>

    <!-- Filter and Export Controls -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
      <!-- Active Filters Badge -->
      <div
        v-if="activeFilterCount > 0"
        class="flex items-center justify-between"
      >
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ activeFilterCount }} filtro{{ activeFilterCount !== 1 ? 's' : '' }} activo{{ activeFilterCount !== 1 ? 's' : '' }}
        </span>
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-x"
          @click="clearFilters"
        >
          Limpiar filtros
        </UButton>
      </div>

      <!-- Filter Controls -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <!-- Status Filter -->
        <USelect
          v-model="filters.status"
          :items="availableStatuses.map(s => ({ label: s.label, value: s.value }))"
          placeholder="Estado"
          multiple
          size="sm"
          @update:model-value="onFiltersChange"
        />

        <!-- Type Filter -->
        <USelect
          v-model="filters.type"
          :items="[
            { label: 'Anotación', value: 'annotation' },
            { label: 'Comentario', value: 'comment' },
            { label: 'Accidente', value: 'accident' }
          ]"
          placeholder="Tipo"
          multiple
          size="sm"
          @update:model-value="onFiltersChange"
        />

        <!-- Priority Filter -->
        <USelect
          v-model="filters.priority"
          :items="[
            { label: 'Baja', value: 'low' },
            { label: 'Media', value: 'medium' },
            { label: 'Alta', value: 'high' },
            { label: 'Crítica', value: 'critical' }
          ]"
          placeholder="Prioridad"
          multiple
          size="sm"
          @update:model-value="onFiltersChange"
        />

        <!-- Export Buttons -->
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-file-spreadsheet"
            size="sm"
            color="neutral"
            variant="outline"
            @click="exportIssues('csv')"
          >
            Exportar CSV
          </UButton>
        </div>
      </div>
    </div>

    <!-- Issues List -->
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard
        v-for="issue in issues"
        :key="issue.id"
        class="hover:shadow-md transition-shadow cursor-pointer"
        @click="viewIssue(issue.id)"
      >
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2">
            <UIcon
              :name="getTypeIcon(issue.type)"
              class="w-5 h-5"
            />
            <h3 class="font-semibold truncate">
              {{ issue.title }}
            </h3>
          </div>
          <UBadge
            :class="getPriorityClass(issue.priority)"
            size="xs"
          >
            {{ issue.priority }}
          </UBadge>
        </div>

        <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <p>{{ issue.title }}</p>
        </div>

        <div class="mt-3 flex justify-between items-center text-xs">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-image"
                class="w-4 h-4"
              />
              {{ issue.photoCount }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon
                name="i-lucide-message-circle"
                class="w-4 h-4"
              />
              {{ issue.commentCount }}
            </span>
          </div>
          <span>{{ new Date(issue.createdAt).toLocaleDateString() }}</span>
        </div>
      </UCard>
    </div>

    <!-- No Issues Message -->
    <div
      v-if="!loading && issues.length === 0"
      class="text-center py-12"
    >
      <UIcon
        name="i-lucide-folder-open"
        class="w-12 h-12 mx-auto text-gray-400"
      />
      <h3 class="mt-4 text-lg font-medium">
        {{ activeFilterCount > 0 ? 'No se encontraron incidencias' : 'No hay issues' }}
      </h3>
      <p class="mt-1 text-gray-500">
        {{ activeFilterCount > 0 ? 'Prueba con otros filtros o crea un nuevo issue' : 'Crea tu primer issue para comenzar a colaborar' }}
      </p>
      <UButton
        class="mt-4"
        icon="i-lucide-plus"
        @click="openCreateIssueModal"
      >
        Crear Issue
      </UButton>
    </div>

    <!-- Issue Modal -->
    <UModal
      v-model:open="isModalOpen"
      :fullscreen="!!currentIssue"
      :ui="{ wrapper: 'flex min-h-full items-center justify-center' }"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3
            id="modal-title"
            class="text-lg font-medium"
          >
            {{ isEditing ? 'Editar Issue' : (currentIssue ? currentIssue.title : 'Nuevo Issue') }}
          </h3>
          <div class="flex items-center gap-2">
            <UButton
              v-if="currentIssue && !isEditing"
              color="primary"
              variant="ghost"
              size="sm"
              icon="i-lucide-edit"
              @click="startEdit"
            >
              Editar
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              aria-label="Cerrar modal"
              @click="isModalOpen = false"
            />
          </div>
        </div>
      </template>

      <template #body>
        <div
          id="modal-description"
          class="sr-only"
        >
          Formulario para crear o editar issues del proyecto
        </div>

        <!-- Unified Form -->
        <div class="space-y-6">
          <!-- Issue Details (always visible for existing issues) -->
          <div
            v-if="currentIssue && !isEditing"
            class="space-y-6"
          >
            <!-- Issue Metadata -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                <div class="mt-1">
                  <UBadge
                    :color="currentIssue.type === 'accident' ? 'error' : currentIssue.type === 'comment' ? 'info' : 'warning'"
                  >
                    {{ currentIssue.type }}
                  </UBadge>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad</label>
                <div class="mt-1">
                  <UBadge :class="getPriorityClass(currentIssue.priority)">
                    {{ currentIssue.priority }}
                  </UBadge>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                <div class="mt-1">
                  <UBadge :class="getStatusClass(currentIssue.status)">
                    {{ getStatusText(currentIssue.status) }}
                  </UBadge>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Asignado a</label>
                <div class="mt-1 text-sm">
                  {{ getAssignedUser(currentIssue.assignedTo) }}
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Creado por</label>
                <div class="mt-1 text-sm">
                  {{ currentIssue.createdBy }}
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                <div class="mt-1 text-sm">
                  {{ new Date(currentIssue.createdAt).toLocaleString() }}
                </div>
              </div>
            </div>

            <!-- Status Management Section -->
            <div class="border-t pt-4">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Gestión de Estado</label>
              <div class="mt-2 flex flex-wrap gap-2">
                <UButton
                  v-for="status in availableStatuses"
                  :key="status.value"
                  :color="getStatusColor(status.value)"
                  :variant="currentIssue.status === status.value ? 'solid' : 'soft'"
                  size="xs"
                  :disabled="!canChangeStatus(currentIssue.status, status.value)"
                  @click="changeStatus(status.value)"
                >
                  {{ status.label }}
                </UButton>
              </div>
              <div class="mt-2 text-xs text-gray-500">
                Estado actual: <strong>{{ getStatusText(currentIssue.status) }}</strong>
              </div>
            </div>

            <!-- Description (read-only) -->
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <div class="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {{ currentIssue.description }}
              </div>
            </div>
          </div>

          <!-- Edit Form (visible when editing or creating) -->
          <div
            v-if="!currentIssue || isEditing"
            class="space-y-4"
          >
            <UForm
              id="issue-form"
              :state="newIssue"
              @submit.prevent="isEditing ? updateIssue() : createIssue()"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField
                  label="Título"
                  name="title"
                  class="md:col-span-2"
                >
                  <UInput
                    v-model="newIssue.title"
                    placeholder="Título del issue"
                  />
                </UFormField>

                <UFormField
                  label="Descripción"
                  name="description"
                  class="md:col-span-2"
                >
                  <UTextarea
                    v-model="newIssue.description"
                    placeholder="Descripción detallada"
                  />
                </UFormField>

                <UFormField
                  label="Tipo"
                  name="type"
                >
                  <USelect
                    v-model="newIssue.type"
                    :items="[
                      { label: 'Anotación', value: 'annotation' },
                      { label: 'Comentario', value: 'comment' },
                      { label: 'Accidente', value: 'accident' }
                    ]"
                  />
                </UFormField>

                <UFormField
                  label="Prioridad"
                  name="priority"
                >
                  <USelect
                    v-model="newIssue.priority"
                    :items="[
                      { label: 'Baja', value: 'low' },
                      { label: 'Media', value: 'medium' },
                      { label: 'Alta', value: 'high' },
                      { label: 'Crítica', value: 'critical' }
                    ]"
                  />
                </UFormField>

                <UFormField
                  v-if="isEditing"
                  label="Estado"
                  name="status"
                >
                  <USelect
                    v-model="newIssue.status"
                    :items="availableStatuses"
                  />
                </UFormField>

                <UFormField
                  v-if="isEditing"
                  label="Asignar a"
                  name="assignedTo"
                >
                  <USelect
                    v-model="newIssue.assignedTo"
                    :items="projectUsers"
                    multiple
                  />
                </UFormField>
              </div>
            </UForm>
          </div>

          <!-- Photo Section (available for all modes) -->
          <div v-if="currentIssue || (!currentIssue && !isEditing)">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Fotos</label>
            <div class="mt-2 flex items-center gap-3">
              <UInput
                type="file"
                accept="image/*"
                @change="(e: any) => selectedFile = e.target.files[0]"
              />
              <UButton
                :loading="uploading"
                @click="currentIssue ? uploadPhoto(currentIssue.id) : uploadNewPhoto()"
              >
                Subir
              </UButton>
            </div>

            <!-- Photo Gallery -->
            <div
              v-if="(currentIssue?.photos.length || 0) > 0 || tempPhotos.length > 0"
              class="mt-4 grid grid-cols-3 gap-2"
            >
              <div
                v-for="photo in currentIssue?.photos || []"
                :key="photo.id"
                class="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
              >
                <img
                  :src="photo.url"
                  :alt="photo.caption || 'Issue photo'"
                  class="w-full h-full object-cover"
                >
              </div>
              <div
                v-for="photo in tempPhotos"
                :key="photo.id"
                class="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-blue-500"
              >
                <img
                  :src="photo.url"
                  :alt="photo.caption || 'Nueva foto'"
                  class="w-full h-full object-cover"
                >
              </div>
            </div>
          </div>

          <!-- Comments Section (only for existing issues) -->
          <div v-if="currentIssue">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Comentarios</label>
            <div class="mt-2 space-y-3">
              <div
                v-for="comment in currentIssue.comments"
                :key="comment.id"
                class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <span class="font-medium">{{ comment.userName }}</span>
                    <span class="text-xs text-gray-500 ml-2">
                      {{ new Date(comment.createdAt).toLocaleString() }}
                    </span>
                  </div>
                  <UButton
                    v-if="canDeleteComment(comment)"
                    icon="i-heroicons-trash"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="promptDeleteComment(comment.id)"
                  />
                </div>
                <p class="mt-1 text-gray-700 dark:text-gray-300">
                  {{ comment.text }}
                </p>
              </div>
            </div>

            <!-- Add Comment -->
            <div class="mt-4">
              <UTextarea
                v-model="newComment"
                placeholder="Añadir un comentario..."
              />
              <div class="mt-2 flex justify-end">
                <UButton
                  icon="i-lucide-send"
                  @click="addComment"
                >
                  Comentar
                </UButton>
              </div>
            </div>
          </div>

          <!-- Delete Confirmation Modal -->
          <UModal
            v-model:open="showDeleteCommentModal"
            title="Eliminar Comentario"
          >
            <template #body>
              <p>¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.</p>
            </template>
            <template #footer>
              <UButton
                color="error"
                @click="confirmDeleteComment"
              >
                Eliminar
              </UButton>
              <UButton
                color="neutral"
                variant="ghost"
                @click="showDeleteCommentModal = false"
              >
                Cancelar
              </UButton>
            </template>
          </UModal>

          <!-- Change History Section -->
          <div
            v-if="currentIssue && changeHistory.length > 0"
            class="border-t pt-4"
          >
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Historial de Cambios</label>
              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-refresh-cw"
                @click="loadIssueHistory"
              >
                Actualizar
              </UButton>
            </div>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="change in changeHistory.slice(0, 10)"
                :key="change.id"
                class="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
              >
                <UIcon
                  name="i-lucide-clock"
                  class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ change.changedBy }}</span>
                    <span class="text-gray-500">{{ formatHistoryAction(change) }}</span>
                  </div>
                  <div class="text-gray-600 dark:text-gray-400 mt-1">
                    {{ formatHistoryValue(change) }}
                  </div>
                  <div class="text-gray-400 mt-1">
                    {{ formatHistoryTime(change.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <!-- Create Mode Buttons -->
          <template v-if="!currentIssue">
            <UButton
              type="submit"
              color="primary"
              form="issue-form"
              :disabled="!newIssue.title"
            >
              Crear Issue
            </UButton>
            <UButton
              color="neutral"
              @click="isModalOpen = false"
            >
              Cancelar
            </UButton>
          </template>

          <!-- Edit Mode Buttons -->
          <template v-if="currentIssue && isEditing">
            <UButton
              type="submit"
              color="primary"
              form="issue-form"
              :disabled="!newIssue.title"
            >
              Guardar Cambios
            </UButton>
            <UButton
              color="neutral"
              @click="cancelEdit"
            >
              Cancelar
            </UButton>
          </template>

          <!-- View Mode Buttons -->
          <template v-if="currentIssue && !isEditing">
            <UButton
              color="neutral"
              @click="isModalOpen = false"
            >
              Cerrar
            </UButton>
          </template>
        </div>
      </template>
    </UModal>
  </div>
</template>
