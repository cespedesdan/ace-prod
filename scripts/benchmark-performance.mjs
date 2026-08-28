import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const baseUrl = (process.env.PERF_BASE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')
const numberOfRuns = Number.parseInt(process.env.PERF_RUNS || '5', 10)
const minimumScore = process.env.PERF_MIN_SCORE === undefined
  ? null
  : Number.parseInt(process.env.PERF_MIN_SCORE, 10)
const label = (process.env.PERF_LABEL || new Date().toISOString()).replace(/[^a-zA-Z0-9_-]/g, '-')
const outputDirectory = join(process.cwd(), '.performance-reports', label)
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const routePaths = (process.env.PERF_ROUTES || '/,/copa-ace-10,/hall-of-fame')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean)
const routes = routePaths.map((path) => ({
  name: path === '/' ? 'home' : path.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-'),
  path,
}))

if (!Number.isInteger(numberOfRuns) || numberOfRuns < 1) {
  throw new Error('PERF_RUNS must be a positive integer')
}

if (minimumScore !== null && (!Number.isInteger(minimumScore) || minimumScore < 0 || minimumScore > 100)) {
  throw new Error('PERF_MIN_SCORE must be an integer between 0 and 100')
}

if (routes.length === 0 || routes.some(({ path }) => !path.startsWith('/'))) {
  throw new Error('PERF_ROUTES must be a comma-separated list of absolute route paths')
}

if (new Set(routes.map(({ name }) => name)).size !== routes.length) {
  throw new Error('PERF_ROUTES contains paths that map to the same report filename')
}

mkdirSync(outputDirectory, { recursive: true })

for (const route of routes) {
  for (let run = 1; run <= numberOfRuns; run += 1) {
    const outputPath = join(outputDirectory, `${route.name}-${run}.json`)
    const result = spawnSync(npx, [
      '--no-install',
      'lighthouse',
      `${baseUrl}${route.path}`,
      '--only-categories=performance',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--throttling-method=simulate',
      '--output=json',
      `--output-path=${outputPath}`,
      '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
      '--quiet',
    ], { stdio: 'inherit' })

    if (result.status !== 0) process.exit(result.status ?? 1)
    console.log(`Completed ${route.name} run ${run}/${numberOfRuns}`)
  }
}

const median = (values) => values.sort((left, right) => left - right)[Math.floor(values.length / 2)]
const summary = routes.map((route) => {
  const runs = Array.from({ length: numberOfRuns }, (_, index) => {
    const file = join(outputDirectory, `${route.name}-${index + 1}.json`)
    return JSON.parse(readFileSync(file, 'utf8'))
  })

  const metric = (audit) => median(runs.map((report) => report.audits[audit].numericValue))
  return {
    route: route.path,
    score: median(runs.map((report) => Math.round(report.categories.performance.score * 100))),
    fcpMs: Math.round(metric('first-contentful-paint')),
    lcpMs: Math.round(metric('largest-contentful-paint')),
    tbtMs: Math.round(metric('total-blocking-time')),
    cls: Number(metric('cumulative-layout-shift').toFixed(3)),
    transferKiB: Math.round(metric('total-byte-weight') / 1024),
  }
})

console.table(summary)
console.log(`Reports: ${outputDirectory}`)

if (minimumScore !== null) {
  const failures = summary.filter(({ score }) => score < minimumScore)
  if (failures.length > 0) {
    console.error(`Performance score gate failed (minimum ${minimumScore}): ${failures.map(({ route, score }) => `${route}=${score}`).join(', ')}`)
    process.exitCode = 1
  }
}
