import crypto from 'crypto'
import { Worker } from '../../models/Worker'
import { Center } from '../../models/Center'
import { EmergencyPlan } from '../../models/EmergencyPlan'
import { NotificacionTelegram } from '../../models/NotificacionTelegram'
import { connectDB } from '../../utils/db'
import { sendTelegramMessage, generateWorkerPlanMessage } from '../../utils/telegram'

const usedNonces = new Set<string>()
const NONCE_TTL_MS = 10 * 60 * 1000
setInterval(() => { usedNonces.clear() }, NONCE_TTL_MS)

export default defineEventHandler(async (event) => {
  try {
    const signature = getRequestHeader(event, 'x-fireplan-signature')
    const timestamp = getRequestHeader(event, 'x-fireplan-timestamp')
    if (!signature || !timestamp) throw createError({ statusCode: 401, message: 'Missing signature or timestamp' })
    const now = Math.floor(Date.now() / 1000)
    const ts = parseInt(timestamp)
    if (isNaN(ts) || Math.abs(now - ts) > 300) throw createError({ statusCode: 401, message: 'Timestamp expired' })
    const body = await readBody(event)
    const secret = process.env.JORNADA_WEBHOOK_SECRET || process.env.FIREPLAN_WEBHOOK_SECRET
    if (!secret) throw createError({ statusCode: 500, message: 'Webhook secret not configured' })
    const payload = JSON.stringify(body)
    const expectedSig = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) throw createError({ statusCode: 401, message: 'Invalid signature' })
    if (body.nonce && usedNonces.has(body.nonce)) throw createError({ statusCode: 401, message: 'Duplicate nonce' })
    if (body.nonce) usedNonces.add(body.nonce)
    await connectDB()
    const { workerId, centerId, tenantId, tipo } = body
    if (!workerId || !centerId || !tenantId || !tipo) throw createError({ statusCode: 400, message: 'Missing required fields' })
    const worker = await Worker.findOne({ $or: [{ fichajeExternoId: workerId }, { _id: workerId }], tenantId })
    if (!worker) throw createError({ statusCode: 404, message: 'Worker not found' })
    const isAssigned = worker.centers.some((c: any) => c.centerId.toString() === centerId)
    if (!isAssigned) throw createError({ statusCode: 403, message: 'Worker not assigned to this center' })
    const center = await Center.findById(centerId)
    if (tipo === 'entrada' && worker.telegramChatId) {
      const plan = await EmergencyPlan.findOne({ centerId, status: 'active' }).sort({ version: -1 })
      const messageText = generateWorkerPlanMessage(worker, center, plan)
      const result = await sendTelegramMessage({ chatId: worker.telegramChatId, text: messageText, parseMode: 'HTML' })
      const notif = new NotificacionTelegram({ workerId: worker._id, centerId, tenantId, tipo: 'fichaje_entrada', mensaje: messageText, chatId: worker.telegramChatId, estado: result.ok ? 'enviada' : 'error', error: result.error || undefined, sentAt: result.ok ? new Date() : undefined })
      await notif.save()
      return { success: true, message: `Fichaje ${tipo} registered for worker ${worker.name}`, telegramSent: result.ok, telegramError: result.error || undefined }
    }
    return { success: true, message: `Fichaje ${tipo} registered for worker ${worker.name}`, telegramSent: false, reason: tipo !== 'entrada' ? 'Not an entry check-in' : 'No telegramChatId' }
  } catch (error: any) { if (error.statusCode) throw error; throw createError({ statusCode: 500, message: error.message }) }
})
