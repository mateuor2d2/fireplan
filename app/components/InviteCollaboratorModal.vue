<script setup lang="ts">
import { z } from 'zod'

const props = defineProps<{
  obraId: string
  obraName: string
}>()

const emit = defineEmits<{
  close: []
  invited: []
}>()

const toast = useToast()
const isSubmitting = ref(false)

const schema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido')
})

type FormState = z.output<typeof schema>

const state = reactive<FormState>({
  email: ''
})

async function onSubmit() {
  isSubmitting.value = true
  try {
    const result = await $fetch<{ success: boolean; message: string; isNewUser: boolean }>(
      `/api/obras/${props.obraId}/invite`,
      {
        method: 'POST',
        body: { email: state.email }
      }
    )

    if (result.isNewUser) {
      toast.add({
        title: 'Invitación enviada',
        description: `Se ha enviado una invitación a ${state.email}`,
        color: 'success',
        icon: 'i-lucide-mail'
      })
    } else {
      toast.add({
        title: 'Colaborador añadido',
        description: result.message || `${state.email} ha sido añadido como colaborador`,
        color: 'success',
        icon: 'i-lucide-user-check'
      })
    }

    state.email = ''
    emit('invited')
    emit('close')
  } catch (error: any) {
    toast.add({
      title: 'Error al invitar',
      description: error.data?.message || error.message || 'No se pudo enviar la invitación',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close') }"
    title="Invitar colaborador"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-user-plus"
          class="w-5 h-5 text-primary"
        />
        <span class="text-lg font-semibold">Invitar colaborador</span>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Invita a un colaborador a la obra <strong>{{ obraName }}</strong>
        </p>
        <UForm
          :schema="schema"
          :state="state"
          @submit="onSubmit"
        >
          <UFormField
            name="email"
            label="Email del colaborador"
            required
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="correo@ejemplo.com"
              icon="i-lucide-mail"
            />
          </UFormField>
          <div class="flex justify-end gap-3 mt-6">
            <UButton
              color="neutral"
              variant="ghost"
              @click="emit('close')"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-send"
              :loading="isSubmitting"
            >
              Invitar colaborador
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
