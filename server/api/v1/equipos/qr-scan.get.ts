import { EquipoContraIncendios } from '../../../models/EquipoContraIncendios'
import { QRScan } from '../../../models/QRScan'
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const codigoQR = query.qr as string
    if (!codigoQR) throw createError({ statusCode: 400, message: 'QR code is required' })
    const equipo = await EquipoContraIncendios.findOne({ codigoQR })
    if (!equipo) throw createError({ statusCode: 404, message: 'Equipo not found' })
    const scan = new QRScan({ equipoId: equipo._id, centerId: equipo.centerId, tenantId: equipo.tenantId, scannedBy: { tipo: 'anonimo' }, accion: 'consulta' })
    await scan.save()
    return { success: true, data: { equipo: { _id: equipo._id, tipo: equipo.tipo, codigoQR: equipo.codigoQR, ubicacion: equipo.ubicacion, marca: equipo.marca, modelo: equipo.modelo, fechaInstalacion: equipo.fechaInstalacion, fechaCaducidad: equipo.fechaCaducidad, capacidad: equipo.capacidad, agenteExtintor: equipo.agenteExtintor, ultimaRevision: equipo.ultimaRevision, proximaRevision: equipo.proximaRevision, estado: equipo.estado, manualUsoUrl: equipo.manualUsoUrl, fotoUrl: equipo.fotoUrl } } }
  } catch (error: any) { if (error.statusCode) throw error; throw createError({ statusCode: 500, message: error.message }) }
})
