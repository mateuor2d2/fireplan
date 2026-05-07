// composables/useCheckboxModel.ts
import type { MiniConcepto, MiniConceptoTree } from '@/stores/conceptos'
import { useConceptoStore } from '@/stores/conceptos'
import { usePlanesStore } from '@/stores/planes'

const planStore = usePlanesStore()
const conceptoStore = useConceptoStore()
export function useCheckboxModel(
  conceptosPlan: MiniConceptoTree[],
  conceptoGeneral: MiniConcepto,
  index: number
) {
  const isChecked = (
    conceptosPlan: MiniConceptoTree[],
    conceptoGeneral: MiniConcepto
  ) => {
    console.log('vect conceptosPlan ' + JSON.stringify(conceptosPlan))
    console.log('conceptoGeneral ' + JSON.stringify(conceptoGeneral))
    const test: boolean = conceptosPlan.some(
      (concepto: MiniConceptoTree) =>
        concepto.name === conceptoGeneral.nom_concepto
    )

    console.log('test ' + JSON.stringify(test))
    return test
  }
  const getCapituloName = (capituloId: number): string => {
    // Try to get from loaded capitulos first
    const capitulo = conceptoStore.capitulos.find(c => c.id === capituloId)
    if (capitulo) {
      return capitulo.descripcion
    }

    // Fallback to legacy hardcoded names if not loaded yet
    const fallbackNames: { [key: number]: string } = {
      1: 'Actuaciones Previas',
      2: 'Demoliciones',
      3: 'Movimiento de tierras',
      4: 'Cimentaciones',
      5: 'Estructuras',
      6: 'Fabricas y particiones',
      7: 'Carpinterías',
      8: 'Vidriería',
      9: 'Telecomunicaciones',
      10: 'Climatización',
      11: 'Electricidad',
      12: 'Depósitos de agua',
      13: 'Protección contra incendios',
      14: 'Instalaciones de saneamiento',
      15: 'Energía solar',
      16: 'Ascensores',
      17: 'Impermeabilizaciones y cubiertas',
      18: 'Pinturas',
      19: 'Revocos - Enyesados - F.Techos',
      20: 'Trabajos de Asfaltado',
      21: 'Solados - alicatados - escaleras',
      22: 'Señalización',
      23: 'Mobiliario',
      24: 'Jardinería',
      25: 'Trabajos posteriores y mantenimiento',
      26: 'Instalaciones provisionales de obra',
      27: 'Maquinaria de obra',
      28: 'Pequeña maquinaria',
      29: 'Medios Auxiliares',
      30: 'Equipos de protección individual',
      31: 'Protecciones colectivas'
    }

    return fallbackNames[capituloId] || `Capitulo ${capituloId}`
  }

  const convertFromMiniConceptoToMiniConceptoTree = (
    conceptoGeneral: MiniConcepto
  ): MiniConceptoTree => {
    return {
      id: conceptoGeneral.id,
      name: conceptoGeneral.nom_concepto,
      desc_concepto: conceptoGeneral.desc_concepto,
      capitulo: conceptoGeneral.capitulo,
      capitulo_nom: getCapituloName(conceptoGeneral.capitulo)
    }
  }
  return computed({
    get: () => isChecked(conceptosPlan, conceptoGeneral),
    set: (value: boolean) => {
      console.log('conceptoGeneral ' + JSON.stringify(conceptoGeneral))
      console.log('value ' + JSON.stringify(value))
      if (value) {
        const existingIndex = planStore.planActual.treePartidas[
          conceptoGeneral.capitulo - 1
        ].children.findIndex(
          (partida: MiniConceptoTree) =>
            partida.name === conceptoGeneral.nom_concepto
        )
        console.log('existingIndex ' + JSON.stringify(existingIndex))
        if (existingIndex === -1) {
          planStore.planActual.treePartidas[
            conceptoGeneral.capitulo - 1
          ].children.push(
            convertFromMiniConceptoToMiniConceptoTree(conceptoGeneral)
          )
        }
      } else {
        const existingIndex = planStore.planActual.treePartidas[
          conceptoGeneral.capitulo - 1
        ].children.findIndex(
          (partida: MiniConceptoTree) =>
            partida.name === conceptoGeneral.nom_concepto
        )
        if (existingIndex !== -1) {
          planStore.planActual.treePartidas[
            conceptoGeneral.capitulo - 1
          ].children.splice(existingIndex, 1)
        }
      }
    }
  })
}
