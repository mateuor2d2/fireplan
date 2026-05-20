const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

export interface TelegramMessage {
  chatId: string
  text: string
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
}

export async function sendTelegramMessage(message: TelegramMessage): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  if (!BOT_TOKEN) {
    return { ok: false, error: 'Telegram bot token not configured' }
  }
  try {
    const res = await $fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      body: { chat_id: message.chatId, text: message.text, parse_mode: message.parseMode || 'HTML' }
    }) as any
    if (res.ok) {
      return { ok: true, messageId: res.result?.message_id }
    }
    return { ok: false, error: res.description || 'Unknown error' }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to send message' }
  }
}

export function generateWorkerPlanMessage(worker: any, center: any, plan: any): string {
  const role = worker.emergencyRole || 'ninguno'
  const roleDescriptions: Record<string, string> = {
    evacuacion: 'Dirigir la evacuación del personal hacia el punto de encuentro.',
    primeros_auxilios: 'Prestar primeros auxilios a los afectados hasta llegada de servicios médicos.',
    extincion: 'Actuar en la extinción inicial del fuego con medios disponibles.',
    comunicaciones: 'Gestionar las comunicaciones con servicios de emergencia externos.',
    centro_control: 'Coordinar desde el centro de control las acciones de emergencia.',
    ninguno: 'Seguir las instrucciones del personal designado y evacuar ordenadamente.'
  }
  return `<b>🔥 FirePlan — Entrada registrada</b>

Hola <b>${worker.name}</b>,
Has fichado en <b>${center?.name || 'tu centro'}</b>.

<b>Tu rol en el Plan de Emergencia:</b>
🎖 ${role.toUpperCase()}

${roleDescriptions[role] || roleDescriptions.ninguno}

<b>Punto de encuentro:</b>
📍 ${plan?.cap6?.puntoEncuentro?.ubicacion || 'Consulta el plan'}

<b>Centro de control:</b>
🎛 ${plan?.cap6?.centroControl?.ubicacion || 'Consulta el plan'}

<b>Teléfonos de emergencia:</b>
${(plan?.cap4?.comunicaciones?.telefonosEmergencia || []).map((t: any) => `📞 ${t.nombre}: ${t.numero}`).join('\n') || 'Consulta el plan'}

<i>Mantén la calma y sigue el protocolo.</i>`.trim()
}
