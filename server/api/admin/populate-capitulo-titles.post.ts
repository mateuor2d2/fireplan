import { z } from 'zod'
import { useDb } from '../../utils/db'

// Response interface
interface BatchUpdateResponse {
  success: boolean
  message: string
  updated: number
  skipped: number
  errors: string[]
}

export default defineEventHandler<Promise<BatchUpdateResponse>>(
  async (event) => {
    const { Concepto } = useDb()

    try {
      // Check if user is admin (you'll need to implement proper admin check)
      // For now, we'll assume the middleware handles this
      console.log('Starting batch population of capitulo titles...')

      // Get the conceptos store to access capitulos data
      // Hardcoded capitulos based on the store data
      const capitulos = [
        { id: 1, descripcion: 'Actuaciones Previas' },
        { id: 2, descripcion: 'Demoliciones' },
        { id: 3, descripcion: 'Movimiento de tierras' },
        { id: 4, descripcion: 'Cimentaciones' },
        { id: 5, descripcion: 'Estructuras' },
        { id: 6, descripcion: 'Fabricas y particiones' },
        { id: 7, descripcion: 'Carpinterías' },
        { id: 8, descripcion: 'Vidriería' },
        { id: 9, descripcion: 'Telecomunicaciones' },
        { id: 10, descripcion: 'Climatización' },
        { id: 11, descripcion: 'Electricidad' },
        { id: 12, descripcion: 'Depósitos de agua' },
        { id: 13, descripcion: 'Protección contra incendios' },
        { id: 14, descripcion: 'Instalaciones de saneamiento' },
        { id: 15, descripcion: 'Energía solar' },
        { id: 16, descripcion: 'Ascensores' },
        { id: 17, descripcion: 'Impermeabilizaciones y cubiertas' },
        { id: 18, descripcion: 'Pinturas' },
        { id: 19, descripcion: 'Revocos - Enyesados - F.Techos' },
        { id: 20, descripcion: 'Trabajos de Asfaltado' },
        { id: 21, descripcion: 'Solados - alicatados - escaleras' },
        { id: 22, descripcion: 'Señalización' },
        { id: 23, descripcion: 'Mobiliario' },
        { id: 24, descripcion: 'Jardinería' },
        { id: 25, descripcion: 'Trabajos posteriores y mantenimiento' },
        { id: 26, descripcion: 'Instalaciones provisionales de obra' },
        { id: 27, descripcion: 'Maquinaria de obra' },
        { id: 28, descripcion: 'Pequeña maquinaria' },
        { id: 29, descripcion: 'Medios Auxiliares' },
        { id: 30, descripcion: 'Equipos de proteccion individual' },
        { id: 31, descripcion: 'Protecciones colectivas' }
      ]

      // Find all conceptos that don't have capitulo_title or have an empty one
      const conceptosToUpdate = await Concepto.find({
        $or: [
          { capitulo_title: { $exists: false } },
          { capitulo_title: null },
          { capitulo_title: '' },
          { capitulo_title: { $in: [null, '', undefined] } }
        ]
      }).lean()

      console.log(`Found ${conceptosToUpdate.length} conceptos to update`)

      let updated = 0
      let skipped = 0
      const errors: string[] = []

      // Process each concepto
      for (const concepto of conceptosToUpdate) {
        try {
          const capitulo = capitulos.find(c => c.id === concepto.capitulo)

          if (capitulo) {
            await Concepto.updateOne(
              { _id: concepto._id },
              {
                $set: {
                  capitulo_title: capitulo.descripcion,
                  updatedAt: new Date()
                }
              }
            )
            updated++
            console.log(`Updated concepto ${concepto._id}: ${capitulo.descripcion}`)
          } else {
            skipped++
            console.log(`Skipped concepto ${concepto._id}: No capitulo found for id ${concepto.capitulo}`)
          }
        } catch (error: any) {
          const errorMsg = `Error updating concepto ${concepto._id}: ${error.message}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      const response: BatchUpdateResponse = {
        success: true,
        message: `Batch update completed. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`,
        updated,
        skipped,
        errors
      }

      console.log('Batch population completed:', response)
      return response
    } catch (error: any) {
      console.error('Error in batch population:', error)

      return {
        success: false,
        message: `Error during batch update: ${error.message}`,
        updated: 0,
        skipped: 0,
        errors: [error.message]
      }
    }
  }
)
