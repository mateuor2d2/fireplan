import mongoose from 'mongoose'

const PROD_URI = 'mongodb+srv://OpPreveniusdb:***@cluster0-xa8jw.mongodb.net/preveniusdb'
const DEV_URI  = process.env.ME_CONFIG_MONGODB_URL || 'mongodb://localhost:27017/preveniusdbDev'

async function diagnose(uri, label) {
  console.log(`\n========== ${label} ==========`)
  const conn = await mongoose.createConnection(uri).asPromise()
  const db = conn.db

  const collections = await db.listCollections().toArray()
  console.log('Collections:', collections.map(c => c.name).sort().join(', '))

  const counts = {}
  for (const col of collections.map(c => c.name)) {
    try {
      counts[col] = await db.collection(col).countDocuments()
    } catch (e) {
      counts[col] = 'ERROR'
    }
  }

  console.log('\nDocument counts:')
  for (const [col, count] of Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${col}: ${count}`)
  }

  // Specific checks
  const users = await db.collection('users').find({}, { projection: { email: 1, plan: 1, role: 1 } }).toArray()
  console.log(`\nUsers (${users.length}):`)
  users.forEach(u => console.log(`  - ${u.email} | plan=${u.plan || 'N/A'} | role=${u.role || 'N/A'}`))

  const planes = await db.collection('planes').find({}, { projection: { nom_obra: 1, createdBy: 1 } }).toArray()
  console.log(`\nPlanes (${planes.length}):`)
  planes.forEach(p => console.log(`  - ${p.nom_obra} | createdBy=${p.createdBy}`))

  const obraMembers = await db.collection('obramembers').find({}, { projection: { obraId: 1, userId: 1, role: 1 } }).toArray()
  console.log(`\nObraMembers (${obraMembers.length}):`)
  obraMembers.forEach(m => console.log(`  - obraId=${m.obraId} | userId=${m.userId} | role=${m.role}`))

  await conn.close()
}

await diagnose(PROD_URI, 'PRODUCCION (preveniusdb)')
await diagnose(DEV_URI, 'DESARROLLO (preveniusdbDev)')
console.log('\nDone.')
process.exit(0)
