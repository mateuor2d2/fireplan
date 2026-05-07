#!/usr/bin/env node
/**
 * Script de diagnostico para comparar dos bases de datos MongoDB
 * Uso: node scripts/diagnose-db.mjs "mongodb+srv://user:pass@host/preveniusdb" "mongodb+srv://user:pass@host/preveniusdbDev"
 */
import mongoose from 'mongoose'

const args = process.argv.slice(2)
const PROD_URI = args[0] || process.env.ME_CONFIG_MONGODB_URL
const DEV_URI  = args[1] || 'mongodb://localhost:27017/preveniusdbDev'

if (!PROD_URI) {
  console.error('Usage: node scripts/diagnose-db.mjs <PROD_URI> [DEV_URI]')
  console.error('   or: ME_CONFIG_MONGODB_URL=<uri> node scripts/diagnose-db.mjs')
  process.exit(1)
}

async function diagnose(uri, label) {
  console.log(`\n========== ${label} ==========`)
  const conn = await mongoose.createConnection(uri).asPromise()
  const db = conn.db

  const collections = await db.listCollections().toArray()
  console.log('Collections:', collections.map(c => c.name).sort().join(', '))

  const counts = {}
  for (const col of collections.map(c => c.name)) {
    try { counts[col] = await db.collection(col).countDocuments() }
    catch (e) { counts[col] = 'ERROR' }
  }

  console.log('\nDocument counts:')
  for (const [col, count] of Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${col}: ${count}`)
  }

  // Users
  try {
    const users = await db.collection('users').find({}, { projection: { email:1, plan:1, role:1 } }).toArray()
    console.log(`\nUsers (${users.length}):`)
    users.forEach(u => console.log(`  - ${u.email} | plan=${u.plan || 'N/A'} | role=${u.role || 'N/A'}`))
  } catch (e) { console.log('users: collection missing or unreadable') }

  // Planes
  try {
    const planes = await db.collection('planes').find({}, { projection: { nom_obra:1, createdBy:1, partidas:1, userPartidas:1 } }).toArray()
    console.log(`\nPlanes (${planes.length}):`)
    planes.forEach(p => {
      const partCount = Array.isArray(p.partidas) ? p.partidas.length : 0
      const userPartCount = Array.isArray(p.userPartidas) ? p.userPartidas.length : 0
      console.log(`  - ${p.nom_obra} | createdBy=${p.createdBy} | partidas=${partCount} | userPartidas=${userPartCount}`)
    })
  } catch (e) { console.log('planes: collection missing or unreadable') }

  // ObraMembers
  try {
    const members = await db.collection('obramembers').find({}, { projection: { obraId:1, userId:1, role:1 } }).toArray()
    console.log(`\nObraMembers (${members.length}):`)
    members.forEach(m => console.log(`  - obraId=${m.obraId} | userId=${m.userId} | role=${m.role}`))
  } catch (e) { console.log('obramembers: collection missing or unreadable') }

  // Conceptos
  try {
    const conceptos = await db.collection('conceptos').find({}, { projection: { nom_concepto:1, capitulo:1, mguser:1, emailuser:1 } }).limit(5).toArray()
    console.log(`\nConceptos sample (total: ${counts['conceptos'] || '?'}):`)
    conceptos.forEach(c => console.log(`  - ${c.nom_concepto} | cap=${c.capitulo} | mguser=${c.mguser} | emailuser=${c.emailuser}`))
  } catch (e) { console.log('conceptos: collection missing or unreadable') }

  // MasterTables
  try {
    const mt = await db.collection('mastertables').find({}, { projection: { tableType:1, userId:1, isDefault:1 } }).limit(5).toArray()
    console.log(`\nMasterTables sample (total: ${counts['mastertables'] || '?'}):`)
    mt.forEach(m => console.log(`  - type=${m.tableType} | userId=${m.userId} | default=${m.isDefault}`))
  } catch (e) { console.log('mastertables: collection missing or unreadable') }

  await conn.close()
}

try {
  await diagnose(PROD_URI, 'PRODUCCION (preveniusdb)')
  if (DEV_URI) await diagnose(DEV_URI, 'DESARROLLO (preveniusdbDev)')
  console.log('\nDone.')
} catch (err) {
  console.error('Diagnose failed:', err.message)
  process.exit(1)
}
process.exit(0)
