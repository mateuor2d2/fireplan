import mongoose from 'mongoose'
import { PresupuestoDefault } from '../models/PresupuestoDefault.js'

const MONGODB_URL = process.env.ME_CONFIG_MONGODB_URL || 'mongodb://localhost:27017/v9planes'

const presupuestoDefaults = [
  {
    id: 1,
    concepto: 'Casco Seguridad',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 3.658752135745007,
    amortizacion: 100,
    total: 18.293760678725036,
    orden: 1,
    isActive: true
  },
  {
    id: 2,
    concepto: 'Guantes antivibratorios',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 15.90761798150003,
    amortizacion: 100,
    total: 79.53808990750015,
    orden: 2,
    isActive: true
  },
  {
    id: 3,
    concepto: 'Gafas contra riesgo de impacto ocular',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 6.2275378542390865,
    amortizacion: 100,
    total: 31.137689271195434,
    orden: 3,
    isActive: true
  },
  {
    id: 4,
    concepto: 'Mascarilla respiratoria para polvo, filtros recambiables',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 7.93613385965946,
    amortizacion: 100,
    total: 39.6806692982973,
    orden: 4,
    isActive: true
  },
  {
    id: 5,
    concepto: 'Protectores Auditivos',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 7.93613385965946,
    amortizacion: 100,
    total: 39.6806692982973,
    orden: 5,
    isActive: true
  },
  {
    id: 6,
    concepto: 'Cinturón de Seguridad anticaída con arnés y cinchas',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 36.122076238732106,
    amortizacion: 50,
    total: 90.30519059683027,
    orden: 6,
    isActive: true
  },
  {
    id: 7,
    concepto: 'Cinturón antivibratorio para protección riñón',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 25.670182053850233,
    amortizacion: 50,
    total: 64.1754551346256,
    orden: 7,
    isActive: true
  },
  {
    id: 8,
    concepto: 'Par de guantes de goma',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 3.5644847699287103,
    amortizacion: 100,
    total: 17.82242384964355,
    orden: 8,
    isActive: true
  },
  {
    id: 9,
    concepto: 'Par de guantes de serraje',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 5.302539327166677,
    amortizacion: 100,
    total: 26.512696635833386,
    orden: 9,
    isActive: true
  },
  {
    id: 10,
    concepto: 'Par de botas de seguridad con puntera metálica clase III',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 9.839156307075944,
    amortizacion: 100,
    total: 49.19578153537972,
    orden: 10,
    isActive: true
  },
  {
    id: 11,
    concepto: 'Protector de mano para puntero',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 6.0684616744240865,
    amortizacion: 100,
    total: 30.34230837212043,
    orden: 11,
    isActive: true
  },
  {
    id: 12,
    concepto: 'Ml Cuerda de poliamida ',
    tipo: 'Protecciones Personales',
    ud: 5,
    precioud: 17.969716608731517,
    amortizacion: 50,
    total: 44.92429152182879,
    orden: 12,
    isActive: true
  },
  {
    id: 13,
    concepto: 'Señal tráfico reflectante, incluso soportes',
    tipo: 'Protecciones Colectivas',
    ud: 4,
    precioud: 9.45619513344724,
    amortizacion: 20,
    total: 7.5649561067577915,
    orden: 13,
    isActive: true
  },
  {
    id: 14,
    concepto: 'Señal de seguridad incluido soportes y colocación',
    tipo: 'Protecciones Colectivas',
    ud: 3,
    precioud: 11.78342072703706,
    amortizacion: 50,
    total: 17.67513109055559,
    orden: 14,
    isActive: true
  },
  {
    id: 15,
    concepto: 'Valla metálica de 2,5m autoestable',
    tipo: 'Protecciones Colectivas',
    ud: 10,
    precioud: 70.70052436222235,
    amortizacion: 20,
    total: 141.4010487244447,
    orden: 15,
    isActive: true
  },
  {
    id: 16,
    concepto: 'Ml Cinta de balizamiento reflectante',
    tipo: 'Protecciones Colectivas',
    ud: 220,
    precioud: 0.38885288399222295,
    amortizacion: 100,
    total: 85.54763447828905,
    orden: 16,
    isActive: true
  },
  {
    id: 17,
    concepto: 'Extintor polvo polivalente ABC 21A-113B',
    tipo: 'Extinción de incendios',
    ud: 1,
    precioud: 23.56684145407412,
    amortizacion: 25,
    total: 5.89171036351853,
    orden: 17,
    isActive: true
  },
  {
    id: 18,
    concepto: 'Botiquín en obra y reposición anual RD486/97',
    tipo: 'Primeros auxilios',
    ud: 1,
    precioud: 20.620986272314855,
    amortizacion: 50,
    total: 10.310493136157426,
    orden: 18,
    isActive: true
  }
]

async function seedPresupuestoDefaults() {
  try {
    console.log('🔍 [SEED] Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('🔍 [SEED] Connected to MongoDB')

    // Clear existing defaults
    console.log('🔍 [SEED] Clearing existing presupuesto defaults...')
    await PresupuestoDefault.deleteMany({})
    console.log('🔍 [SEED] Cleared existing defaults')

    // Insert new defaults
    console.log('🔍 [SEED] Inserting', presupuestoDefaults.length, 'presupuesto defaults...')
    await PresupuestoDefault.insertMany(presupuestoDefaults)
    console.log('✅ [SEED] Successfully seeded presupuesto defaults')

    // Verify insertion
    const count = await PresupuestoDefault.countDocuments()
    console.log('📊 [SEED] Total presupuesto defaults in database:', count)
  } catch (error) {
    console.error('❌ [SEED] Error seeding presupuesto defaults:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔍 [SEED] Disconnected from MongoDB')
  }
}

// Run the seeding
seedPresupuestoDefaults()
