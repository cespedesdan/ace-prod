import { prisma } from '../src/lib/prisma'
import { runDueFaceitChampionshipSyncs } from '../src/lib/faceit-championship-sync'

async function main() {
  const startedAt = Date.now()
  const results = await runDueFaceitChampionshipSyncs()
  const summary = results.reduce(
    (counts, result) => ({ ...counts, [result.status]: counts[result.status] + 1 }),
    { synced: 0, failed: 0, skipped: 0 },
  )

  for (const result of results) {
    const suffix = result.error ? `: ${result.error}` : ''
    console.info(`[faceit-sync] ${result.tournament}: ${result.status}${suffix}`)
  }
  console.info(`[faceit-sync] completed in ${Date.now() - startedAt}ms`, {
    championships: results.length,
    ...summary,
  })
}

main()
  .catch((error) => {
    console.error('[faceit-sync] worker failed', error instanceof Error ? error.message : 'Unknown error')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
