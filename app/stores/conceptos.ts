import { defineStore } from 'pinia'

import {
  getCurrentUser
  // incrementOperations,
  // decrementOperations,
} from './userService'
import { useUserStore } from './user'
import { useMasterTablesStore } from './masterTables'
import type { MasterTableItem } from './masterTables'

export interface ConceptoListResponse {
  data: Concepto[]
  total: number
  limit: number
  skip: number
}

export type ConceptoApiResponse = Concepto | ConceptoListResponse

// Legacy interface - keeping for backward compatibility
// export interface FeathersResponseConcepto {
//   limit: number;
//   skip: number;
//   total: number;
//   data: Concepto[];
// }

export interface PayloadGetConceptos {
  limit: number
  skip: number
  total: number
  textSearch: string
  searchType: string
  data: Concepto[]
}
export interface MediosGeneric {
  [key: string]: string[]
}
export interface ConceptoGeneric {
  [key: string]:
    | string[]
    | string
    | TipoConceptoUnidad
    | number
    | EvaluacionActual[]
}
export interface Concepto extends ConceptoGeneric {
  _id?: any // Assuming _id can be of any type since it's initially undefined
  id?: any
  nom_concepto: string
  desc_concepto: string
  desc_concepto_preventivo: string
  tipo_concepto_unidad: TipoConceptoUnidad
  precio_concepto: number
  capitulo: number
  capitulo_title?: string
  evaluaciones: EvaluacionActual[] // Replace 'any' with a more specific type if possible
  epis: string[]
  pqs: string[]
  maqs: string[]
  pcols: string[]
  medauxs: string[]
  mguser: any // Replace 'any' with a more specific type if possible
  emailuser: string
  mgroluser: string
}

type ConceptoOrUndefined = Concepto | undefined

interface PayloadConceptoString {
  index: string
  value: any
}
interface PayloadConceptoNumber {
  index: number
  value: any
}
interface TipoConceptoUnidad {
  id: number
  descripcion: string
}

interface Capitulo {
  id: number
  descripcion: string
  order?: number
  name?: string
}

export interface Riesgo {
  id: number
  descripcion: string
}

export interface Probabilidad {
  id: number
  descripcion: string
}

export interface Gravedad {
  id: number
  descripcion: string
}

export interface EvaluacionActual {
  riesgo: Riesgo
  probabilidad: Probabilidad
  gravedad: Gravedad
}
export interface MiniConcepto
  extends Pick<
    Concepto,
    | 'id'
    | 'nom_concepto'
    | 'desc_concepto'
    | 'capitulo'
    | 'emailuser'
    | 'mgroluser'
  > {
  _id?: string
  mguser?: string
  isAdminView?: boolean
  isOwner?: boolean
  ownerName?: string
  ownerEmail?: string
  isAdminConcepto?: boolean
}
export interface MiniConceptoTree
  extends Pick<
    ConceptoGeneric,
    'id' | 'name' | 'desc_concepto' | 'capitulo' | 'capitulo_nom'
  > {}
export interface MiniCapituloConceptos {
  id: string
  name: string
  children: MiniConcepto[]
}

// Assuming the same structure for 'epis', 'pqs', 'maqs', 'pcols', 'medauxs' as arrays of strings

// Main interface that encapsulates all the variables
interface MainInterfaceState {
  [key: string]: any // Adjust the value type (`any`) as necessary
}
interface MainInterface extends MainInterfaceState {
  conceptos: Concepto[]
  conceptosCount: number
  total: number
  skip: number
  limit: number
  conceptoActual: Concepto
  tipo_concepto_unidad: TipoConceptoUnidad[]
  capitulos: Capitulo[]
  capitulosString: string[]
  riesgos: Riesgo[]
  probabilidad: Probabilidad[]
  gravedad: Gravedad[]
  evaluacionActual: EvaluacionActual
  epis: string[]
  pqs: string[]
  maqs: string[]
  pcols: string[]
  medauxs: string[]
  treeCapitulosPartidas: MiniCapituloConceptos[]
  treeCapitulosPartidasActual: MiniCapituloConceptos[]
  // Master tables integration
  masterTablesCache: {
    [key: string]: {
      data: MasterTableItem[]
      timestamp: number
      ttl: number // Time to live in milliseconds
    }
  }
  isLoadingMasterTables: boolean
}

function isConceptoListResponse(
  response: ConceptoApiResponse
): response is ConceptoListResponse {
  return (
    response
    && typeof response === 'object'
    && 'data' in response
    && Array.isArray((response as ConceptoListResponse).data)
  )
}

export const useConceptoStore = defineStore('conceptos', {
  state: (): MainInterface => ({
    conceptos: [],
    conceptosCount: 0,
    total: 0,
    skip: 0,
    limit: 0,
    conceptoActual: {
      _id: 0,
      nom_concepto: '',
      desc_concepto: '',
      desc_concepto_preventivo: '',
      tipo_concepto_unidad: { id: 0, descripcion: '' },
      precio_concepto: 0.0,
      capitulo: 0,
      capitulo_title: undefined,
      evaluaciones: [],
      epis: [],
      pqs: [],
      maqs: [],
      pcols: [],
      medauxs: [],
      mguser: '',
      emailuser: '',
      mgroluser: ''
    },
    tipo_concepto_unidad: [
      {
        id: 1,
        descripcion: 'ud'
      },
      {
        id: 2,
        descripcion: 'm'
      },
      {
        id: 3,
        descripcion: 'm2'
      },
      {
        id: 4,
        descripcion: 'm3'
      },
      {
        id: 5,
        descripcion: 'kg'
      }
    ],
    capitulosString: [
      'Actuaciones Previas',
      'Demoliciones',
      'Movimiento de tierras',
      'Cimentaciones',
      'Estructuras',
      'Fabricas y particiones',
      'Carpinterías',
      'Vidriería',
      'Telecomunicaciones',
      'Climatización',
      'Electricidad',
      'Depósitos de agua',
      'Protección contra incendios',
      'Instalaciones de saneamiento',
      'Energía solar',
      'Ascensores',
      'Impermeabilizaciones y cubiertas',
      'Pinturas',
      'Revocos - Enyesados - F.Techos',
      'Trabajos de Asfaltado',
      'Solados - alicatados - escaleras',
      'Señalización',
      'Mobiliario',
      'Jardinería',
      'Trabajos posteriores y mantenimiento',
      'Instalaciones provisionales de obra',
      'Maquinaria de obra',
      'Pequeña maquinaria',
      'Medios Auxiliares',
      'Equipos de proteccion individual',
      'Protecciones colectivas'
    ],
    capitulos: [
      {
        id: 1,
        descripcion: 'Actuaciones Previas'
      },
      {
        id: 2,
        descripcion: 'Demoliciones'
      },
      {
        id: 3,
        descripcion: 'Movimiento de tierras'
      },
      {
        id: 4,
        descripcion: 'Cimentaciones'
      },
      {
        id: 5,
        descripcion: 'Estructuras'
      },
      {
        id: 6,
        descripcion: 'Fabricas y particiones'
      },
      {
        id: 7,
        descripcion: 'Carpinterías'
      },
      {
        id: 8,
        descripcion: 'Vidriería'
      },
      {
        id: 9,
        descripcion: 'Telecomunicaciones'
      },
      {
        id: 10,
        descripcion: 'Climatización'
      },
      {
        id: 11,
        descripcion: 'Electricidad'
      },
      {
        id: 12,
        descripcion: 'Depósitos de agua'
      },
      {
        id: 13,
        descripcion: 'Protección contra incendios'
      },
      {
        id: 14,
        descripcion: 'Instalaciones de saneamiento'
      },
      {
        id: 15,
        descripcion: 'Energía solar'
      },
      {
        id: 16,
        descripcion: 'Ascensores'
      },
      {
        id: 17,
        descripcion: 'Impermeabilizaciones y cubiertas'
      },
      {
        id: 18,
        descripcion: 'Pinturas'
      },
      {
        id: 19,
        descripcion: 'Revocos - Enyesados - F.Techos'
      },
      {
        id: 20,
        descripcion: 'Trabajos de Asfaltado'
      },
      {
        id: 21,
        descripcion: 'Solados - alicatados - escaleras'
      },
      {
        id: 22,
        descripcion: 'Señalización'
      },
      {
        id: 23,
        descripcion: 'Mobiliario'
      },
      {
        id: 24,
        descripcion: 'Jardinería'
      },
      {
        id: 25,
        descripcion: 'Trabajos posteriores y mantenimiento'
      },
      {
        id: 26,
        descripcion: 'Instalaciones provisionales de obra'
      },
      {
        id: 27,
        descripcion: 'Maquinaria de obra'
      },
      {
        id: 28,
        descripcion: 'Pequeña maquinaria'
      },
      {
        id: 29,
        descripcion: 'Medios Auxiliares'
      },
      {
        id: 30,
        descripcion: 'Equipos de proteccion individual'
      },
      {
        id: 31,
        descripcion: 'Protecciones colectivas'
      }
    ],
    riesgos: [
      {
        id: 1,
        descripcion: 'Caídas de personas a distinto nivel'
      },
      {
        id: 2,
        descripcion: 'Caídas de personas al mismo nivel'
      },
      {
        id: 3,
        descripcion: 'Caídas de objetos por desplome o derrumbamiento'
      },
      {
        id: 4,
        descripcion: 'Caídas de objetos en manipulación'
      },
      {
        id: 5,
        descripcion: 'Caídas de objetos desprendidos'
      },
      {
        id: 6,
        descripcion: 'Pisadas sobre objetos'
      },
      {
        id: 7,
        descripcion: 'Choques contra objetos inmóviles'
      },
      {
        id: 8,
        descripcion: 'Choques contra objetos móviles'
      },
      {
        id: 9,
        descripcion: 'Golpes por objetos y herramientas'
      },
      {
        id: 10,
        descripcion: 'Proyección de fragmentos o partículas'
      },
      {
        id: 11,
        descripcion: 'Atrapamiento por o entre objetos'
      },
      {
        id: 12,
        descripcion:
          'Atrapamiento por vuelco de máquinas, tractores o vehículos'
      },
      {
        id: 13,
        descripcion: 'Sobreesfuerzos'
      },
      {
        id: 14,
        descripcion: 'Exposición a temperaturas ambientales extremas'
      },
      {
        id: 15,
        descripcion: 'Contactos térmicos'
      },
      {
        id: 16,
        descripcion: 'Exposición a contactos eléctricos'
      },
      {
        id: 17,
        descripcion: 'Exposición a sustancias nocivas o tóxicas'
      },
      {
        id: 18,
        descripcion: 'Contactos con sustancias cáusticas y/o corrosivas'
      },
      {
        id: 19,
        descripcion: 'Exposición a radiaciones'
      },
      {
        id: 20,
        descripcion: 'Explosiones y/o incendios'
      },
      {
        id: 21,
        descripcion: 'Incendios'
      },
      {
        id: 22,
        descripcion: 'Accidentes causados por seres vivos'
      },
      {
        id: 23,
        descripcion: 'Atropellos o golpes con vehículos'
      },
      {
        id: 24,
        descripcion: 'Fatiga visual'
      },
      {
        id: 25,
        descripcion: 'Deslumbramientos'
      },
      {
        id: 26,
        descripcion: 'Exposición a contaminantes biológicos '
      },
      {
        id: 27,
        descripcion: 'Exposición a contaminantes químicos'
      },
      {
        id: 28,
        descripcion: 'Disconfort'
      },
      {
        id: 29,
        descripcion: 'Reflejos'
      },
      {
        id: 30,
        descripcion: 'Estrés'
      },
      {
        id: 31,
        descripcion: 'Fatiga postural'
      },
      {
        id: 32,
        descripcion: 'Exposición al ruido'
      },
      {
        id: 33,
        descripcion: 'Fatiga mental'
      },
      {
        id: 34,
        descripcion: 'Cortes'
      },
      {
        id: 35,
        descripcion: 'Fatiga física'
      },
      {
        id: 36,
        descripcion: 'Exposición a vibraciones'
      },
      {
        id: 37,
        descripcion: 'No existen riesgos asociados'
      },
      {
        id: 38,
        descripcion: 'Riesgo variable'
      },
      {
        id: 39,
        descripcion: 'Desprendimientos por mal apilado de madera'
      },
      {
        id: 40,
        descripcion: 'Golpes en manos durante clavazón'
      },
      {
        id: 41,
        descripcion: 'Vuelco paquetes durante maniobras de grua'
      },
      {
        id: 42,
        descripcion: 'Dermatosis'
      },
      {
        id: 43,
        descripcion: 'Exposicíón a polvo'
      }
    ],
    probabilidad: [
      {
        id: 1,
        descripcion: 'Baja'
      },
      {
        id: 2,
        descripcion: 'Media'
      },
      {
        id: 3,
        descripcion: 'Alta'
      }
    ],
    gravedad: [
      {
        id: 1,
        descripcion: 'Ligeramente Dañino'
      },
      {
        id: 2,
        descripcion: 'Dañino'
      },
      {
        id: 3,
        descripcion: 'Extremadamente Dañino'
      }
    ],
    evaluacionActual: {
      riesgo: { id: 0, descripcion: '' },
      probabilidad: { id: 0, descripcion: '' },
      gravedad: { id: 0, descripcion: '' }
    },
    epis: [
      'Ropa de trabajo',
      'Guantes de cuero',
      'Casco de seguridad',
      'Calzado de seguridad',
      'Chaleco reflectante',
      'Gafas de seguridad antiproyecciones',
      'Ropa impermeable para tiempo lluvioso',
      'Mascarillas antipolvo con filtro mecánico recambiable',
      'Mascarillas con filtro químico recambiable',
      'Guantes PVC o de goma',
      'Línea de vida y arnés de seguridad',
      'Trajes para tiempo lluvioso',
      'Filtros soldadura',
      'Manoplas soldadura',
      'Protección ocular soldadura',
      'Mandil soldadura',
      'Yelmo soldador',
      'Cinturón antivibratorio',
      'Guantes antivibratorios',
      'Cascos protecctores auditivos',
      'Guantes aislantes de la electricidad',
      'Botas de seguridad aislantes',
      'Banquetas de maniobra aislante,s de la electricidad',
      'Pertigas aislantes',
      'Casco aislante con patalla facial aislante de la electricidad',
      'Cinturón portaherramientas',
      'Comprobadores de tensión',
      'Herramientas aislantes'
    ],
    pqs: [
      'Hormigón',
      'Líquido desencofrante',
      'Silicona',
      'Impermeabilizante',
      'Sellador',
      'Pegamento de PVC'
    ],
    maqs: [
      'Retroexcavadora',
      'Maquinillo con apoyo en trípode apuntalado',
      'Camión grúa de descarga',
      'Camión contenedor',
      'Bomba hormigonado',
      'Camión hormigonera',
      'Mesa de corte',
      'Sierra circular',
      'Vibrador',
      'Cortadora material cerámico',
      'Cortador de metal',
      'Radial eléctrica',
      'Rozadora',
      'Compresor',
      'Taladro eléctrico',
      'Taladro batería',
      'Atornillador de batería',
      'Amoladora',
      'Herramientas manuales',
      'Martillo rompedor'
    ],
    pcols: [
      'Vallado',
      'Señalización',
      'Barandillas tipo ayuntamiento',
      'Instalación eléctrica provisional',
      'Toma de tierra',
      'Barandillas tipo A',
      'Barandillas tipo B',
      'Barandillas tipo C',
      'Redes seguridad sistema V (tipo horca)',
      'Redes seguridad tipo T (red horizontal)',
      'Redes seguridad sistema U (red entre barandillas)',
      'Extracción/impulsión Aire'
    ],
    medauxs: [
      'Andamios en general',
      'Andamios de borriquetas',
      'Andamios tubulares europeos',
      'Escaleras de mano',
      'Encofrado metálico para muros',
      'Encofrado para forjado reticular',
      'Encofrado metálico',
      'Contenedores',
      'Carretilla de mano',
      'Cubilote hormigonado',
      'Trompa de escombros',
      'Puntales',
      'Portalámparas portátiles'
    ],
    treeCapitulosPartidas: [],
    treeCapitulosPartidasActual: [],
    // Master tables integration
    masterTablesCache: {},
    isLoadingMasterTables: false,
    conceptoVacio: {
      _id: 0,
      nom_concepto: '',
      desc_concepto: '',
      desc_concepto_preventivo: '',
      tipo_concepto_unidad: { id: 0, descripcion: '' },
      precio_concepto: 0.0,
      capitulo: 0,
      capitulo_title: undefined,
      evaluaciones: [],
      epis: [],
      pqs: [],
      maqs: [],
      pcols: [],
      medauxs: [],
      mguser: '',
      emailuser: '',
      mgroluser: ''
    }
  }),
  getters: {
    //   doubleCount: (state) => this.counter * 2,
  },
  actions: {
    async fetchMiniConceptos(params: {
      limit?: number
      skip?: number
      search?: string
      searchField?: string
      capitulo?: number
    } = {}) {
      try {
        const {
          limit = 10,
          skip = 0,
          search,
          searchField,
          capitulo
        } = params

        const query: Record<string, any> = {
          $limit: limit.toString(),
          $skip: skip.toString()
        }

        if (search) {
          query.search = search
          if (searchField) {
            query.searchField = searchField
          }
        }

        if (capitulo !== undefined) {
          query.capitulo = capitulo.toString()
        }

        // Add user ID if available
        const userStore = useUserStore()
        if (userStore.user) {
          query.userId = userStore.user._id
        }

        const data = await $fetch('/api/conceptos.getMiniConceptos', { query })
        this.conceptos = []
        this.conceptos = [...this.conceptos, ...(data?.data || [])]
        return data
      } catch (error) {
        console.error('Error fetching mini conceptos:', error)
        throw error
      }
    },
    SET_TREE_PARTIDAS_FULL(value: MiniCapituloConceptos[]) {
      console.log('SET_TREE_PARTIDAS_FULL', value)
      this.$patch((state) => {
        state.treeCapitulosPartidas = value
      })
    },
    SET_TREE_PARTIDASACTUAL_FULL(value: MiniCapituloConceptos[]) {
      console.log('SET_TREE_PARTIDASACTUAL_FULL', value)
      this.$patch((state) => {
        state.treeCapitulosPartidasActual = value
      })
    },
    SET_CONCEPTO_ACTUAL_VALUE(value: any, key: string) {
      this.conceptoActual[key] = value
    },
    SET_EVALUACIONACTUAL_INI() {
      this.evaluacionActual = {
        riesgo: { id: 0, descripcion: '' },
        probabilidad: { id: 0, descripcion: '' },
        gravedad: { id: 0, descripcion: '' }
      }
    },
    SET_EVALUACIONACTUAL_VALUE(
      value: Riesgo | Probabilidad | Gravedad,
      key: string
    ) {
      this.evaluacionActual[key as 'riesgo' | 'probabilidad' | 'gravedad']
        = value
    },
    SET_CONCEPTO_ACTUAL_INI() {
      this.$patch({ conceptoActual: this.conceptoVacio })
    },

    ADD_CONCEPTO(value: Concepto | undefined) {
      if (value) {
        this.conceptos.push(value)
        this.conceptosCount = this.conceptosCount + 1
        this.total = this.total + 1
      }
    },

    UPDATE_CONCEPTO(payload: PayloadConceptoNumber) {
      this.conceptos[payload.index] = payload.value
    },
    SET_TOTAL(value: number) {
      if (value) {
        this.total = value
      }
    },
    SET_SKIP(value: number) {
      if (value) {
        this.skip = value
      }
    },
    SET_LIMIT(value: number) {
      if (value) {
        this.limit = value
      }
    },
    SET_CONCEPTO_ACTUAL(value: Concepto) {
      if (value) {
        console.log('dentro set_concepto_actual ' + JSON.stringify(value))
        // merge(this.conceptoActual, value);
        this.$patch((state) => {
          state.conceptoActual = value
        })
        console.log('despues de merge ' + JSON.stringify(this.conceptoActual))
      }
    },
    SET_ID_UNDEFINED() {
      this.conceptoActual._id = undefined
    },
    SET_NOM_CONCEPTO(value: string) {
      this.conceptoActual.nom_concepto = value
    },
    SET_DESC_CONCEPTO(value: string) {
      this.conceptoActual.desc_concepto = value
    },
    SET_INI_CONCEPTOS(value: Concepto[]) {
      this.conceptos = value
    },
    SET_MGROLUSER(value: string) {
      this.conceptoActual.mgroluser = value
    },
    DELETE_CONCEPTO(index: number) {
      this.conceptos.splice(index, 1)
      this.conceptosCount = this.conceptosCount - 1
      this.total = this.total - 1
    },
    initConceptoActual() {
      this.SET_CONCEPTO_ACTUAL_INI()
    },
    updateConceptoField<K extends keyof Concepto>(
      field: K,
      value: Concepto[K]
    ) {
      this.conceptoActual[field] = value
    },
    async loadConceptoActual(id: string) {
      try {
        console.log('Loading concepto with ID:', id)
        const userStore = useUserStore()
        const response = await $fetch<ConceptoApiResponse>('/api/conceptos', {
          method: 'GET',
          params: { accessToken: userStore.getAccessToken, _id: id }
        })

        console.log('Received response:', response)

        if (response) {
          if (isConceptoListResponse(response) && response.data.length > 0) {
            // List response format - use the first item in the data array
            console.log('Setting conceptoActual from list response:', response.data[0])
            this.SET_CONCEPTO_ACTUAL(response.data[0])
            return response
          } else if (!isConceptoListResponse(response)) {
            // Single item response format
            console.log('Setting conceptoActual from single response:', response)
            this.SET_CONCEPTO_ACTUAL(response as Concepto)
            return { data: [response], total: 1, limit: 1, skip: 0 }
          }
        }
        return null
      } catch (error) {
        console.error('Error loading concepto:', error)
        return null
      }
    },
    async getConceptosdeCapitulo(id: number, showOnlyOwn = false) {
    // get todos los conceptos de un capitulo with ownership information
    // Use the same API as fetchMiniConceptos to get enriched data
      try {
        const userStore = useUserStore()

        // Use the same endpoint as fetchMiniConceptos to get ownership information
        const response = await $fetch<{
          data: MiniConcepto[]
          total: number
          limit: number
          skip: number
        }>('/api/conceptos.getMiniConceptos', {
          method: 'GET',
          params: {
            capitulo: id,
            $limit: 9999,
            $skip: 0,
            userId: userStore.user?._id,
            showOnlyOwn: showOnlyOwn.toString()
          }
        })

        console.log(
          `getConceptosdeCapitulo for capitulo ${id}, showOnlyOwn: ${showOnlyOwn}, found ${response.data?.length || 0} conceptos`
        )

        // Debug: Log first few conceptos
        if (response.data && response.data.length > 0) {
          console.log('First concepto sample:', response.data[0])
        }
        return response
      } catch (error) {
        console.log('error getting conceptos with ownership info', error)
        // Fallback to old method if new one fails
        const query = '/api/conceptos?capitulo=' + id + '&$limit=9999'
        try {
          const userStore = useUserStore()
          const response = await $fetch<ConceptoApiResponse>(query, {
            method: 'get',
            params: { accessToken: userStore.getAccessToken, capitulo: id }
          })
          return response
        } catch (fallbackError) {
          console.log('fallback method also failed', fallbackError)
          throw fallbackError
        }
      }
    },
    transformCapituloToTree(
      capitulo: number,
      conceptos: Concepto[] | undefined
    ): MiniCapituloConceptos {
      if (!conceptos) {
        return {
          id: capitulo.toString(),
          name: this.capitulos[capitulo - 1].descripcion,
          children: []
        }
      }

      return {
        id: this.capitulos[capitulo - 1].id.toString(),
        name: this.capitulos[capitulo - 1].descripcion,
        children: conceptos.map(concepto => ({
          id: concepto._id || concepto.id, // Use _id first, fallback to id
          nom_concepto: concepto.nom_concepto,
          desc_concepto: concepto.desc_concepto,
          capitulo: concepto.capitulo,
          emailuser: concepto.emailuser,
          mgroluser: concepto.mgroluser,
          mguser: concepto.mguser,
          isAdminView: concepto.isAdminView,
          isOwner: concepto.isOwner,
          ownerName: concepto.ownerName,
          ownerEmail: concepto.ownerEmail,
          isAdminConcepto: concepto.isAdminConcepto
        }))
      }
    },
    async getTreePartidasFull() {
      // coge todas las partidas mini , las convierte en tree y las ordena por capitulo y
      // luego las mete en el state
      const sortByCapituloId = (
        a: MiniCapituloConceptos | null,
        b: MiniCapituloConceptos | null
      ) => {
        if (a === null && b === null) {
          return 0
        }
        if (a === null) {
          return -1
        }
        if (b === null) {
          return 1
        }
        const idA = parseInt(a.id, 10)
        const idB = parseInt(b.id, 10)
        return idA - idB
      }
      const promises = this.capitulos.map(async (capitulo) => {
        const conceptos = await this.getConceptosdeCapitulo(capitulo.id)
        if (!conceptos || !conceptos.data) {
          // Si conceptos es nulo o no tiene datos, devolver un valor predeterminado o continuar con la siguiente iteración
          return null // O cualquier valor predeterminado que tenga sentido en tu contexto
        }
        return this.transformCapituloToTree(capitulo.id, conceptos.data)
      })

      const result = await Promise.all(promises)
      //   this.$patch((state) => {
      //     state.treeCapitulosPartidas = result.sort(sortByCapituloId);
      // });
      return result.sort(sortByCapituloId)
    },
    // async setConceptoActualById(id: string) {
    //   try {
    //     console.log('Fetching concepto with ID:', id);
    //     const response = await $fetch<ConceptoApiResponse>('/api/conceptos', {
    //       method: 'GET',
    //       params: {
    //         accessToken: store.getAccessToken,
    //         _id: id
    //       },
    //     });

    //     console.log('Server response:', response);

    //     if (response) {
    //       return isConceptoListResponse(response)
    //         ? response
    //         : { data: [response], total: 1, limit: 1, skip: 0 };
    //     }
    //     return null;
    //   } catch (error) {

    async createConcepto() {
      const query = '/api/conceptos'
      try {
        const userStore = useUserStore()
        await $fetch<ConceptoApiResponse>(query, {
          method: 'post',
          body: this.conceptoActual,
          params: {
            accessToken: userStore.getAccessToken
          }
        })
        this.ADD_CONCEPTO(this.conceptoActual)
      } catch (error) {
        alert('error en el post de concepto para el create' + error)
        return error
      }
    },

    async updateConcepto(index: number, idconcepto: string) {
      try {
        const userStore = useUserStore()
        await $fetch<ConceptoApiResponse>(`/api/conceptos/${idconcepto}`, {
          method: 'patch',
          body: this.conceptoActual,
          params: {
            accessToken: userStore.getAccessToken
          }
        })
        // actualizamos el vuex
        this.UPDATE_CONCEPTO({
          value: this.conceptoActual,
          index
        })
      } catch (error) {
        alert('error en el put de concepto para el update' + error)
        return error
      }
    },
    async copyConcepto(concepto: Concepto) {
      // primero hay que obtener el concepto entero
      try {
        // debo recuperar primero el concepto de la bbdd
        console.log('concepto._id=', concepto._id)
        // cargo el concepto entero
        await this.loadConceptoActual(concepto._id)
        // le quito el id al conceptoActual y sobre escribo datos del copiador
        this.SET_ID_UNDEFINED()
        this.SET_CONCEPTO_ACTUAL_VALUE(getCurrentUser()._id, 'mguser')
        this.SET_CONCEPTO_ACTUAL_VALUE(getCurrentUser().email, 'emailuser')
        this.SET_CONCEPTO_ACTUAL_VALUE(getCurrentUser().role, 'mgroluser')

        // Fix the name - avoid double "Copia" prefix
        const originalName = concepto.nom_concepto.startsWith('Copia')
          ? concepto.nom_concepto
          : concepto.nom_concepto
        this.SET_NOM_CONCEPTO('Copia de ' + originalName)
        const query = '/api/conceptos'
        // Trato de escribir el concepto como copia
        try {
          console.log(
            'a ver en this.conceptoActual='
            + JSON.stringify(this.conceptoActual)
          )
          // Remove accessToken and user fields from the body - they're not needed for the API
          const cleanConcepto = {
            nom_concepto: this.conceptoActual.nom_concepto,
            desc_concepto: this.conceptoActual.desc_concepto || this.conceptoActual.nom_concepto || 'Concepto copiado',
            desc_concepto_preventivo: this.conceptoActual.desc_concepto_preventivo || '',
            tipo_concepto_unidad: this.conceptoActual.tipo_concepto_unidad || { id: 1, descripcion: 'ud' },
            precio_concepto: this.conceptoActual.precio_concepto || 0,
            capitulo: this.conceptoActual.capitulo || 1,
            evaluaciones: this.conceptoActual.evaluaciones || [],
            epis: this.conceptoActual.epis || [],
            pqs: this.conceptoActual.pqs || [],
            maqs: this.conceptoActual.maqs || [],
            pcols: this.conceptoActual.pcols || [],
            medauxs: this.conceptoActual.medauxs || [],
            mguser: getCurrentUser()._id,
            emailuser: getCurrentUser().email,
            mgroluser: getCurrentUser().role
          }

          console.log('Sending clean concepto to API:', cleanConcepto)

          await $fetch<ConceptoApiResponse>(query, {
            method: 'post',
            body: cleanConcepto
          })
          this.ADD_CONCEPTO(this.conceptoActual)
        } catch (error) {
          alert('error en el post de concepto para el copy' + error)
          return error
        }
      } catch (errorget) {
        alert('error en el get de concepto para el copy' + errorget)
      }
    },

    async copyConceptoWithName(concepto: MiniConcepto, newName: string) {
      try {
        // Load the full concepto
        await this.loadConceptoActual(concepto._id)

        // Prepare the concepto data for copying
        this.SET_ID_UNDEFINED()
        this.SET_CONCEPTO_ACTUAL_VALUE(getCurrentUser()._id, 'mguser')
        this.SET_CONCEPTO_ACTUAL_VALUE(getCurrentUser().email, 'emailuser')
        this.SET_CONCEPTO_ACTUAL_VALUE(getCurrentUser().role, 'mgroluser')

        // Set the new name
        this.SET_NOM_CONCEPTO(newName)

        // Create a clean concepto object for the API
        const cleanConcepto = {
          nom_concepto: this.conceptoActual.nom_concepto,
          desc_concepto: this.conceptoActual.desc_concepto || this.conceptoActual.nom_concepto || 'Concepto copiado',
          desc_concepto_preventivo: this.conceptoActual.desc_concepto_preventivo || '',
          tipo_concepto_unidad: this.conceptoActual.tipo_concepto_unidad || { id: 1, descripcion: 'ud' },
          precio_concepto: this.conceptoActual.precio_concepto || 0,
          capitulo: this.conceptoActual.capitulo || 1,
          evaluaciones: this.conceptoActual.evaluaciones || [],
          epis: this.conceptoActual.epis || [],
          pqs: this.conceptoActual.pqs || [],
          maqs: this.conceptoActual.maqs || [],
          pcols: this.conceptoActual.pcols || [],
          medauxs: this.conceptoActual.medauxs || [],
          // Required user fields for the new concepto
          mguser: getCurrentUser()._id,
          emailuser: getCurrentUser().email,
          mgroluser: getCurrentUser().role
        }

        // Create the copy via API
        const response = await $fetch<ConceptoApiResponse>('/api/conceptos', {
          method: 'post',
          body: cleanConcepto
        })

        // Add the new concepto to the list
        if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
          this.ADD_CONCEPTO(response.data[0])
        } else if (response && typeof response === 'object' && '_id' in response) {
          this.ADD_CONCEPTO(response as Concepto)
        }

        return response
      } catch (error) {
        console.error('Error copying concepto with name:', error)
        throw error
      }
    },

    async deleteConcepto(index: number, id: string) {
      try {
        await $fetch(`/api/conceptos/${id}`, {
          method: 'delete'
        })
        // actualizamos el vuex
        this.DELETE_CONCEPTO(index)
        this.SET_CONCEPTO_ACTUAL_INI()
      } catch (error) {
        alert('error en el delete de concepto' + error)
        return error
      }
    },
    /**
     * Searches for a concepto by name within a specific capitulo
     * @param capituloId - The ID of the capitulo to search in
     * @param searchTerm - The name or part of the name to search for
     * @returns The first found concepto or undefined if not found
     */
    async searchConceptoInCapitulo(capituloId: number, searchTerm: string): Promise<Concepto | undefined> {
      try {
        const response = await this.getConceptosdeCapitulo(capituloId)

        if (!response || !('data' in response)) {
          return undefined
        }

        const searchLower = searchTerm.toLowerCase()

        return response.data.find(concepto =>
          concepto.nom_concepto.toLowerCase().includes(searchLower)
        )
      } catch (error) {
        console.error('Error searching concepto in capitulo:', error)
        return undefined
      }
    },

    /**
     * Searches for all conceptos that match the search term within a specific capitulo
     * @param capituloId - The ID of the capitulo to search in
     * @param searchTerm - The name or part of the name to search for
     * @returns An array of matching conceptos (empty if none found)
     */
    async searchAllConceptosInCapitulo(capituloId: number, searchTerm: string): Promise<Concepto[]> {
      try {
        const response = await this.getConceptosdeCapitulo(capituloId)

        if (!response || !('data' in response)) {
          return []
        }

        const searchLower = searchTerm.toLowerCase()

        return response.data.filter(concepto =>
          concepto.nom_concepto.toLowerCase().includes(searchLower)
        )
      } catch (error) {
        console.error('Error searching conceptos in capitulo:', error)
        return []
      }
    },

    // Master Tables Integration Methods
    async loadCapitulosFromMasterTables(): Promise<Capitulo[]> {
      try {
        this.isLoadingMasterTables = true
        const masterTablesStore = useMasterTablesStore()
        const userStore = useUserStore()

        console.log('Loading capitulos from master tables...')

        // Check cache first
        const cacheKey = 'capitulo'
        const cached = this.masterTablesCache[cacheKey]
        const now = Date.now()

        if (cached && (now - cached.timestamp) < cached.ttl) {
          console.log('Using cached capitulos data, count:', cached.data.length)
          // TEMPORARY: Force cache bypass for debugging
          console.log('BYPASSING CACHE to check for updated capitulos')
          // return this.transformMasterTableItemsToCapitulos(cached.data);
        }

        // Load from master tables store
        await masterTablesStore.loadTables('capitulo')

        // For capitulos, prioritize defaults (shared admin capitulos) over user-specific ones
        let capitulosData = masterTablesStore.defaultTables.capitulo || []

        console.log(`Found ${capitulosData.length} default capitulos from master tables`)

        // If no defaults, check user tables as fallback
        if (capitulosData.length === 0) {
          console.log('No default capitulos found, checking user capitulos...')
          capitulosData = masterTablesStore.userTables.capitulo || []

          if (capitulosData.length === 0) {
            throw new Error('No capitulos found in database (neither default nor user). Please ensure capitulos are properly seeded.')
          }
        }

        // Cache the data
        this.masterTablesCache[cacheKey] = {
          data: capitulosData,
          timestamp: now,
          ttl: 5 * 60 * 1000 // 5 minutes
        }

        const result = this.transformMasterTableItemsToCapitulos(capitulosData)
        console.log(`Loaded ${result.length} capitulos from master tables`)

        return result
      } catch (error) {
        console.error('Error loading capitulos from master tables:', error)
        // Don't fallback to hardcoded data - throw the error so the UI can handle it
        throw new Error(`Failed to load capitulos from database: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        this.isLoadingMasterTables = false
      }
    },

    async copyDefaultCapitulosToUser(): Promise<void> {
      try {
        const userStore = useUserStore()
        const userId = userStore.user?._id

        if (!userId) {
          console.warn('No user ID available for copying default capitulos')
          return
        }

        console.log('Copying default capitulos to user...')

        const response = await $fetch('/api/mastertables/copy-defaults', {
          method: 'POST',
          body: {
            tableType: 'capitulo',
            userId: userId,
            force: false
          }
        })

        console.log('Default capitulos copied successfully:', response)
      } catch (error) {
        console.error('Error copying default capitulos:', error)
      }
    },

    transformMasterTableToCapitulo(item: MasterTableItem): Capitulo {
      return {
        id: item.id,
        descripcion: item.description,
        order: 0, // Default order since it's not in MasterTableItem
        name: item.description // Use description as name
      }
    },

    transformMasterTableItemsToCapitulos(items: MasterTableItem[]): Capitulo[] {
      return items
        .filter(item => item.isActive !== false) // Include items that are active or undefined
        .map(item => this.transformMasterTableToCapitulo(item))
        .sort((a, b) => a.id - b.id)
    },

    // Enhanced getTreePartidasFull that uses master tables
    async getTreePartidasFullWithMasterTables(onProgress?: (step: string) => void, showOnlyOwn = false) {
      try {
        console.log('Building tree with master tables integration...')
        onProgress?.('loading-capitulos')

        // Load capitulos from master tables
        const capitulos = await this.loadCapitulosFromMasterTables()

        if (capitulos.length === 0) {
          throw new Error('No capitulos found in database. Please ensure capitulos are properly seeded.')
        }

        onProgress?.('loading-conceptos')

        // Build tree using master tables capitulos
        const promises = capitulos.map(async (capitulo) => {
          const conceptos = await this.getConceptosdeCapitulo(capitulo.id, showOnlyOwn)
          if (!conceptos || !conceptos.data) {
            return null
          }
          return this.transformCapituloToTree(capitulo.id, conceptos.data)
        })

        onProgress?.('building-tree')
        const result = await Promise.all(promises)
        const filteredResult = result.filter(item => item !== null) as MiniCapituloConceptos[]

        onProgress?.('finalizing')
        console.log(`Built tree with ${filteredResult.length} capitulos from master tables`)
        return filteredResult.sort((a, b) => a.id - b.id) // Simple numeric sort
      } catch (error) {
        console.error('Error building tree with master tables:', error)
        // Don't fallback - let the error propagate so the UI can handle it properly
        throw error
      }
    },

    // Plan-specific capitulos and partidas loading with user settings support
    async getTreePartidasForPlan(planId?: string, onProgress?: (step: string) => void, showOnlyOwn = false) {
      try {
        console.log('Building tree for plan:', planId, 'showOnlyOwn:', showOnlyOwn)
        onProgress?.('checking')

        const userStore = useUserStore()
        const planesStore = usePlanesStore()
        const appSettings = userStore.user.appSettings

        // If no plan ID or persistence is disabled, use global capitulos
        if (!planId || !appSettings?.persistCapitulosPerPlan) {
          console.log('Using global capitulos (no plan ID or persistence disabled)')
          return await this.getTreePartidasFullWithMasterTables(onProgress, showOnlyOwn)
        }

        // Try to get plan-specific capitulos first
        const plan = planesStore.planActual
        if (plan && plan._id === planId && plan.userCapitulos && plan.userCapitulos.length > 0) {
          console.log('Using plan-specific capitulos')
          return await this.buildTreeFromPlanCapitulos(plan.userCapitulos, onProgress, showOnlyOwn)
        }

        // Fallback to user's default capitulos if auto-load is enabled
        if (appSettings?.autoLoadUserDefaults) {
          console.log('Using user default capitulos (plan-specific not found)')
          return await this.getTreePartidasFullWithMasterTables(onProgress)
        }

        // No fallback - throw error so user knows there's a database issue
        throw new Error('No capitulos found and all fallback methods failed. Please ensure the database is properly seeded with capitulos.')
      } catch (error) {
        console.error('Error building tree for plan:', error)
        // Don't fallback - propagate the error
        throw error
      }
    },

    // Build tree from plan-specific capitulos
    async buildTreeFromPlanCapitulos(planCapitulos: any[], onProgress?: (step: string) => void, showOnlyOwn = false) {
      try {
        const promises = planCapitulos.map(async (capitulo) => {
          const conceptos = await this.getConceptosdeCapitulo(capitulo.id, showOnlyOwn)
          if (!conceptos || !conceptos.data) {
            return null
          }
          return this.transformCapituloToTree(capitulo.id, conceptos.data)
        })

        const result = await Promise.all(promises)
        const filteredResult = result.filter(item => item !== null) as MiniCapituloConceptos[]

        console.log(`Built tree with ${filteredResult.length} plan-specific capitulos`)
        return filteredResult.sort((a, b) => a.id - b.id)
      } catch (error) {
        console.error('Error building tree from plan capitulos:', error)
        throw error
      }
    },

    // Clear master tables cache
    clearMasterTablesCache() {
      this.masterTablesCache = {}
      console.log('Master tables cache cleared')
    },

    // Auto-populate capitulo_title based on capitulo number
    setCapituloTitle(capituloNumber: number) {
      const capitulo = this.capitulos.find(c => c.id === capituloNumber)
      if (capitulo) {
        this.conceptoActual.capitulo_title = capitulo.descripcion
        console.log(`Auto-populated capitulo_title: ${capitulo.descripcion} for capitulo: ${capituloNumber}`)
      } else {
        this.conceptoActual.capitulo_title = undefined
        console.log(`No capitulo found for number: ${capituloNumber}`)
      }
    },

    // Get capitulo title by number
    getCapituloTitle(capituloNumber: number): string | undefined {
      const capitulo = this.capitulos.find(c => c.id === capituloNumber)
      return capitulo?.descripcion
    }
  }
})
