<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-medium">
        Verificación de Identidad
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Verifica tu identidad mediante email o SMS
      </p>
    </template>

    <div class="space-y-4">
      <!-- Verification Method Selection -->
      <UFormField
        label="Método de verificación"
        name="method"
        required
      >
        <USelect
          v-model="selectedMethod"
          :items="methodOptions"
          placeholder="Selecciona cómo recibir tu código"
          :disabled="sending || verified"
        />
      </UFormField>

      <!-- Contact Info Display (read-only) -->
      <UAlert
        icon="i-heroicons-information-circle"
        color="info"
        variant="soft"
        :title="`Código enviado a ${selectedMethod === 'email' ? 'email' : 'SMS'}`"
        :description="selectedMethod === 'email' ? emailMask : phoneMask"
      />

      <!-- Send Code Button -->
      <UButton
        v-if="!verified"
        :loading="sending"
        :disabled="!canResend || sending"
        block
        @click="handleSendCode"
      >
        {{ sending ? 'Enviando...' : resendCountdown > 0 ? `Reenviar (${resendCountdown}s)` : 'Enviar código de verificación' }}
      </UButton>

      <!-- Code Input Section -->
      <div
        v-if="lastSentAt && !verified"
        class="space-y-3"
      >
        <UFormField
          label="Código de verificación"
          name="code"
        >
          <UInput
            v-model="code"
            placeholder="Ingresa el código de 6 dígitos"
            maxlength="6"
            :disabled="verifying"
            @keyup.enter="handleValidate"
          />
        </UFormField>

        <UButton
          :loading="verifying"
          :disabled="code.length !== 6"
          block
          @click="handleValidate"
        >
          {{ verifying ? 'Verificando...' : 'Verificar código' }}
        </UButton>
      </div>

      <!-- Verified Status -->
      <UAlert
        v-if="verified"
        icon="i-heroicons-check-circle"
        color="success"
        variant="soft"
        title="¡Verificación completada!"
        description="Tu identidad ha sido verificada correctamente"
      />

      <!-- Error Display -->
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { ValidateResult } from '~/server/services/verificationService'

/**
 * VerificationForm Component
 *
 * Standalone verification UI component that allows users to:
 * - Select verification method (email/SMS)
 * - Request verification code via "Send Code" button
 * - Enter 6-digit verification code
 * - Resend code with countdown timer (60 seconds)
 * - See visual verification status
 *
 * @props {string} obraId - Associated work/plan ID
 * @props {string} email - User email (masked for display)
 * @props {string} phone - User phone (masked for display)
 * @emits {void} verified - Emitted when verification succeeds
 * @emits {string} error - Emitted with error message on failure
 */

interface Props {
  obraId: string
  email?: string
  phone?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  verified: []
  error: [message: string]
}>()

// Use verification composable
const {
  sending,
  verifying,
  canResend,
  resendCountdown,
  lastSentAt,
  error,
  verified,
  sendCode,
  validateCode,
  reset
} = useVerification()

// Component state
const selectedMethod = ref<'email' | 'sms'>('email')
const code = ref('')

// Method options for dropdown
const methodOptions = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' }
]

/**
 * Mask email for display (show first 2 chars, rest masked)
 */
const emailMask = computed(() => {
  if (!props.email) return 'No proporcionado'
  const [local, domain] = props.email.split('@')
  if (local.length <= 2) return props.email
  return `${local.slice(0, 2)}***@${domain}`
})

/**
 * Mask phone for display (show last 4 digits only)
 */
const phoneMask = computed(() => {
  if (!props.phone) return 'No proporcionado'
  return `***-***-${props.phone.slice(-4)}`
})

/**
 * Handle send code button click
 */
async function handleSendCode() {
  const result = await sendCode({
    obraId: props.obraId,
    email: props.email,
    phone: props.phone,
    method: selectedMethod.value
  })

  if (result.success) {
    emit('verified')
  } else {
    emit('error', result.data.message || 'Error al enviar código')
  }
}

/**
 * Handle validate code button click
 */
async function handleValidate() {
  if (code.value.length !== 6) return

  const result = await validateCode(code.value, props.obraId) as ValidateResult

  if (result.verified) {
    emit('verified')
  } else {
    emit('error', result.error || 'Código inválido')
  }
}

// Expose reset method for parent component
defineExpose({
  reset
})
</script>
