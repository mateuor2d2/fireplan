export interface IRiesgo {
  id: number
  descripcion: string
}

export interface IProbabilidad {
  id: number
  descripcion: string
}

export interface IGravedad {
  id: number
  descripcion: string
}

export interface IEvaluacionActual {
  riesgo: IRiesgo
  probabilidad: IProbabilidad
  gravedad: IGravedad
}

export interface ITipoConceptoUnidad {
  id: number
  descripcion: string
}

export interface IConcepto {
  _id?: string
  nom_concepto: string
  desc_concepto: string
  desc_concepto_preventivo: string
  tipo_concepto_unidad: ITipoConceptoUnidad
  precio_concepto: number
  capitulo: number
  capitulo_title?: string
  evaluaciones: IEvaluacionActual[]
  epis: string[]
  pqs: string[]
  maqs: string[]
  pcols: string[]
  medauxs: string[]
  mguser: string
  emailuser: string
  mgroluser: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IConceptoResponse {
  data: IConcepto[]
  total: number
  limit: number
  skip: number
}

export interface IConceptoCreate extends Omit<IConcepto, '_id' | 'createdAt' | 'updatedAt' | 'mguser' | 'emailuser' | 'mgroluser'> {}

export interface IConceptoUpdate extends Partial<Omit<IConcepto, '_id' | 'createdAt' | 'updatedAt' | 'mguser' | 'emailuser' | 'mgroluser'>> {
  updatedAt?: Date
}
