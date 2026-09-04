process.env.GCLOUD_PROJECT = 'queima-asfalto'
process.env.DISCOVERY_SOURCES = 'acorrer.pt,davengo.com,kilometerliebe.de,running.life,running.life/half-marathons,runme.de,scc-events.com,marathon.de,planet-marathon.de'
const { initializeApp } = await import('firebase-admin/app')
const { getFirestore } = await import('firebase-admin/firestore')
initializeApp({ projectId: 'queima-asfalto' })
const db = getFirestore()
console.log('catálogo antes:', (await db.collection('raceCatalog').get()).size, new Date().toISOString())
const { refreshDiscoveryCatalog } = await import('./lib/discovery/harvest.js')
const { enabledSources } = await import('./lib/discovery/sources.js')
for (const source of enabledSources()) {
  const started = Date.now()
  try {
    const run = await refreshDiscoveryCatalog(new Date(), [source])
    console.log(`${source.id}: ${JSON.stringify(run)} ${((Date.now()-started)/1000).toFixed(0)}s`)
  } catch (error) {
    console.log(`${source.id}: FALHOU ${String(error).slice(0, 90)}`)
  }
}
console.log('catálogo depois:', (await db.collection('raceCatalog').get()).size, 'FIM')
