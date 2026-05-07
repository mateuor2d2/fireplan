import { useDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const { Planes } = useDb()
    const query = getQuery(event)
    
    // Find plan by obra name
    const plan = await Planes.findOne({
      nom_obra: { $regex: 'SANTA LAVINIA', $options: 'i' }
    }).lean()
    
    if (!plan) {
      return { error: 'Plan not found' }
    }
    
    return {
      planId: plan._id?.toString(),
      nom_obra: plan.nom_obra,
      createdBy: plan.createdBy?.toString(),
      partidas_count: plan.partidas?.length || 0,
      userPartidas_count: plan.userPartidas?.length || 0,
      userCapitulos_count: plan.userCapitulos?.length || 0,
      presupuesto_count: plan.presupuesto?.length || 0,
      userPresupuesto_count: plan.userPresupuesto?.length || 0,
      // Show first few userPartidas
      userPartidas_sample: plan.userPartidas?.slice(0, 5).map((p: any) => ({
        id: p.id,
        nom_concepto: p.nom_concepto,
        capitulo: p.capitulo,
        capitulo_nom: p.capitulo_nom
      })) || [],
      // Show all capitulos from userPartidas
      capitulos_in_userPartidas: [...new Set((plan.userPartidas || []).map((p: any) => p.capitulo))],
      // Show userCapitulos
      userCapitulos: plan.userCapitulos?.map((c: any) => ({ id: c.id, name: c.name })) || []
    }
  } catch (error: any) {
    return { error: error.message }
  }
})
