<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Historial de Pagos
      </h1>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">
            Pagos e Invoices
          </h2>
          <div class="flex items-center gap-3">
            <USelect
              v-if="selectedTab === 'payments'"
              v-model="sortOption"
              :items="sortOptions"
              option-attribute="label"
              value-attribute="value"
              class="w-52"
            />
            <USelect
              v-model="selectedTab"
              :items="tabOptions"
              option-attribute="label"
              value-attribute="value"
            />
          </div>
        </div>
      </template>

      <div
        v-if="pending"
        class="flex justify-center items-center h-32"
      >
        <UProgress indeterminate />
      </div>

      <div v-else-if="error">
        <UAlert
          color="red"
          variant="subtle"
          title="Error"
          :description="error.message || 'Failed to load payment history'"
          icon="i-lucide-alert-circle"
        />
      </div>

      <div v-else-if="selectedTab === 'payments'">
        <div
          v-if="payments?.length === 0"
          class="text-center py-8"
        >
          <p class="text-gray-500">
            No se encontraron pagos.
          </p>
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="payment in sortedPayments"
            :key="payment._id"
            class="border rounded-lg p-4 transition-colors"
            :class="payment.status === 'pending' ? 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="payment.status === 'pending' && handlePendingClick(payment)"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold">
                    {{ payment.plan?.nom_obra || 'Plan sin nombre' }}
                  </h3>
                  <UBadge
                    :color="getPaymentStatusColor(payment.status)"
                    variant="subtle"
                  >
                    {{ formatPaymentStatus(payment.status) }}
                  </UBadge>
                  <UTooltip
                    v-if="payment.status === 'pending'"
                    text="Pagar ahora"
                  >
                    <UBadge
                      color="primary"
                      variant="solid"
                      size="sm"
                    >
                      <UIcon
                        name="i-lucide-credit-card"
                        class="mr-1"
                      />
                      Pagar ahora
                    </UBadge>
                  </UTooltip>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                  {{ payment.plan?.desc_obra || 'Sin descripción' }}
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  ID: {{ payment.stripePaymentIntentId }}
                </p>
              </div>

              <div class="flex items-start gap-2">
                <div class="text-right">
                  <p class="font-semibold">
                    {{ formatCurrency(payment.amount, payment.currency) }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formatDate(payment.createdAt) }}
                  </p>
                  <p
                    v-if="payment.paymentMethod"
                    class="text-sm text-gray-500"
                  >
                    Método: {{ payment.paymentMethod }}
                  </p>
                </div>

                <UButton
                  v-if="userStore.user?.role === 'admin'"
                  icon="i-lucide-trash"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click.stop="openDeleteModal(payment)"
                />
              </div>
            </div>
          </div>

          <div
            v-if="pagination"
            class="flex justify-between items-center"
          >
            <p class="text-sm text-gray-500">
              Mostrando {{ sortedPayments.length || 0 }} de {{ pagination.totalPayments }} pagos
            </p>
            <UPagination
              :page="currentPage"
              :page-count="pagination.limit"
              :total="pagination.totalPayments"
              :to="(page: number) => ({ query: { ...route.query, page } })"
            />
          </div>
        </div>
      </div>

      <div v-else-if="selectedTab === 'invoices'">
        <div
          v-if="invoices?.length === 0"
          class="text-center py-8"
        >
          <p class="text-gray-500">
            No se encontraron invoices.
          </p>
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="invoice in invoices"
            :key="invoice._id"
            class="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-semibold">
                  {{ invoice.description || 'Invoice' }}
                </h3>
                <p
                  v-if="invoice.plan"
                  class="text-sm text-gray-500 mt-1"
                >
                  {{ invoice.plan.nom_obra || 'Plan sin nombre' }}
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  ID: {{ invoice.stripeInvoiceId }}
                </p>
              </div>

              <div class="text-right">
                <p class="font-semibold">
                  {{ formatCurrency(invoice.amount, invoice.currency) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(invoice.createdAt) }}
                </p>
                <UButton
                  v-if="invoice.invoiceUrl"
                  :to="invoice.invoiceUrl"
                  target="_blank"
                  color="gray"
                  variant="ghost"
                  size="xs"
                  class="mt-1"
                >
                  Descargar
                  <UIcon
                    name="i-lucide-download"
                    class="ml-1"
                  />
                </UButton>
              </div>
            </div>
          </div>

          <div
            v-if="pagination"
            class="flex justify-between items-center"
          >
            <p class="text-sm text-gray-500">
              Mostrando {{ invoices?.length || 0 }} de {{ pagination.totalInvoices }} invoices
            </p>
            <UPagination
              :page="currentPage"
              :page-count="pagination.limit"
              :total="pagination.totalInvoices"
              :to="(page: number) => ({ query: { ...route.query, page } })"
            />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="deleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold text-lg">
              Confirmar eliminación
            </h3>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            ¿Estás seguro de que deseas eliminar este pago de
            <span class="font-semibold">{{ deleteTarget ? formatCurrency(deleteTarget.amount, deleteTarget.currency) : '' }}</span>
            ({{ deleteTarget?.plan?.nom_obra || 'Plan sin nombre' }})?
            Esta acción no se puede deshacer.
          </p>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="gray"
                variant="ghost"
                @click="deleteModalOpen = false"
              >
                Cancelar
              </UButton>
              <UButton
                color="error"
                :loading="deleting"
                @click="confirmDelete"
              >
                Eliminar
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'

definePageMeta({
  middleware: 'auth',
  layout: 'app'
})

interface PaymentPlan {
  nom_obra?: string
  desc_obra?: string
}

interface Payment {
  _id: string
  planId: string
  plan?: PaymentPlan
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  stripePaymentIntentId: string
  createdAt: string
  paymentMethod?: string
}

interface CheckoutResponse {
  checkoutUrl: string
  sessionId: string
  paymentId: string
}

const userStore = useUserStore()
const route = useRoute()
const toast = useToast()

// Tabs
const selectedTab = ref<'payments' | 'invoices'>('payments')
const tabOptions = [
  { label: 'Pagos', value: 'payments' },
  { label: 'Invoices', value: 'invoices' }
]

// Sorting
const sortOption = ref('date-desc')
const sortOptions = [
  { label: 'Fecha (más recientes)', value: 'date-desc' },
  { label: 'Fecha (más antiguos)', value: 'date-asc' },
  { label: 'Estado (pendientes primero)', value: 'status-pending' },
  { label: 'Estado (pagados primero)', value: 'status-paid' },
  { label: 'Importe (mayor a menor)', value: 'amount-desc' },
  { label: 'Importe (menor a mayor)', value: 'amount-asc' }
]

// Pagination
const limit = ref(10)
const currentPage = computed(() => Number(route.query.page) || 1)

// Fetch payment history
const { data, pending, error, refresh } = await useLazyAsyncData(
  'payment-history',
  () => $fetch('/api/payments/history', {
    params: {
      page: Number(route.query.page) || 1,
      limit: limit.value
    }
  }),
  {
    watch: [() => route.query.page]
  }
)

// Computed properties for easier access
const payments = computed(() => data.value?.data?.payments || [])
const invoices = computed(() => data.value?.data?.invoices || [])
const pagination = computed(() => data.value?.data?.pagination)

// Sorted payments
const sortedPayments = computed(() => {
  const list = [...(payments.value || [])]
  switch (sortOption.value) {
    case 'date-asc':
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    case 'date-desc':
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'status-pending':
      return list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        return 0
      })
    case 'status-paid':
      return list.sort((a, b) => {
        if (a.status === 'succeeded' && b.status !== 'succeeded') return -1
        if (a.status !== 'succeeded' && b.status === 'succeeded') return 1
        return 0
      })
    case 'amount-desc':
      return list.sort((a, b) => b.amount - a.amount)
    case 'amount-asc':
      return list.sort((a, b) => a.amount - b.amount)
    default:
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
})

// Delete modal state
const deleteModalOpen = ref(false)
const deleteTarget = ref<Payment | null>(null)
const deleting = ref(false)

// Helper functions
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency?.toUpperCase() || 'EUR'
  }).format(amount)
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatPaymentStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    succeeded: 'Completado',
    pending: 'Pendiente',
    failed: 'Fallido',
    canceled: 'Cancelado'
  }
  return statusMap[status] || status
}

const getPaymentStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    succeeded: 'green',
    pending: 'red',
    failed: 'red',
    canceled: 'gray'
  }
  return colorMap[status] || 'gray'
}

// Handle clicking a pending payment
const handlePendingClick = async (payment: Payment) => {
  try {
    const result = await $fetch<CheckoutResponse>('/api/payments/create-checkout', {
      method: 'POST',
      body: { planId: payment.planId }
    })
    if (result.checkoutUrl) {
      await navigateTo(result.checkoutUrl, { external: true })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo redirigir al checkout'
    const dataMessage = (err as { data?: { message?: string } })?.data?.message
    toast.add({
      title: 'Error al iniciar el pago',
      description: dataMessage || message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Delete handlers
const openDeleteModal = (payment: Payment) => {
  deleteTarget.value = payment
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return

  deleting.value = true
  try {
    await $fetch(`/api/payments/${deleteTarget.value._id}`, { method: 'DELETE' })
    toast.add({
      title: 'Pago eliminado',
      description: 'El pago se ha eliminado correctamente.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    deleteModalOpen.value = false
    deleteTarget.value = null
    await refresh()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo eliminar el pago'
    const dataMessage = (err as { data?: { message?: string } })?.data?.message
    toast.add({
      title: 'Error al eliminar',
      description: dataMessage || message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    deleting.value = false
  }
}
</script>
