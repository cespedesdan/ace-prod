import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Exception approved on 2026-10-03; remove once braces has a patched release.
const advisory = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm'
const expiresAt = new Date('2026-11-02T00:00:00Z')
const chain = {
  'eslint-config-next': '@next/eslint-plugin-next',
  '@next/eslint-plugin-next': 'fast-glob',
  'fast-glob': 'micromatch',
  micromatch: 'braces',
  braces: advisory,
}

function blockedVulnerabilities(report, lock, now = new Date()) {
  assert.equal(report.auditReportVersion, 2, 'Unsupported npm audit report')
  assert.ok(report.vulnerabilities && typeof report.vulnerabilities === 'object')
  const vulnerabilities = Object.values(report.vulnerabilities)
  assert.equal(report.metadata?.vulnerabilities?.total, vulnerabilities.length)

  return vulnerabilities.filter((vulnerability) => {
    assert.ok(['info', 'low', 'moderate', 'high', 'critical'].includes(vulnerability.severity))
    if (!['high', 'critical'].includes(vulnerability.severity)) return false
    const expected = chain[vulnerability.name]
    const onlyKnownAdvisory = expected && vulnerability.via?.length === 1 &&
      (vulnerability.name === 'braces'
        ? vulnerability.via[0]?.url === advisory &&
          vulnerability.via[0]?.dependency === 'braces' &&
          vulnerability.via[0]?.severity === 'high'
        : vulnerability.via[0] === expected)
    const onlyDevelopment = vulnerability.nodes?.length > 0 &&
      vulnerability.nodes.every((node) => lock.packages?.[node]?.dev === true)
    return !(now < expiresAt && vulnerability.severity === 'high' &&
      onlyKnownAdvisory && onlyDevelopment)
  })
}

if (process.argv.includes('--self-test')) {
  const vulnerabilities = Object.fromEntries(Object.entries(chain).map(([name, via]) => [name, {
    name, severity: 'high', nodes: [`node_modules/${name}`],
    via: [name === 'braces' ? { url: via, dependency: name, severity: 'high' } : via],
  }]))
  const report = { auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: { total: 5 } } }
  const lock = { packages: Object.fromEntries(Object.keys(chain).map((name) => [`node_modules/${name}`, { dev: true }])) }
  const now = new Date('2026-10-03T00:00:00Z')
  assert.equal(blockedVulnerabilities(report, lock, now).length, 0)
  assert.equal(blockedVulnerabilities(report, lock, expiresAt).length, 5)
  const unrelated = structuredClone(report)
  unrelated.vulnerabilities.other = { name: 'other', severity: 'high', via: [], nodes: [] }
  unrelated.metadata.vulnerabilities.total++
  assert.equal(blockedVulnerabilities(unrelated, lock, now).length, 1)
  const empty = { auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { total: 0 } } }
  assert.equal(blockedVulnerabilities(empty, lock, expiresAt).length, 0)
  const changed = structuredClone(report)
  changed.vulnerabilities.braces.via[0].url = 'https://github.com/advisories/NEW'
  assert.equal(blockedVulnerabilities(changed, lock, now).length, 1)
  changed.vulnerabilities.braces.via.push({ url: 'https://github.com/advisories/NEW', severity: 'high' })
  assert.equal(blockedVulnerabilities(changed, lock, now).length, 1)
  changed.vulnerabilities.braces = structuredClone(report.vulnerabilities.braces)
  changed.vulnerabilities.braces.severity = 'critical'
  assert.equal(blockedVulnerabilities(changed, lock, now).length, 1)
  const runtimeLock = structuredClone(lock)
  runtimeLock.packages['node_modules/braces'].dev = false
  assert.equal(blockedVulnerabilities(report, runtimeLock, now).length, 1)
  delete runtimeLock.packages['node_modules/braces']
  assert.equal(blockedVulnerabilities(report, runtimeLock, now).length, 1)
  assert.throws(() => blockedVulnerabilities({ error: 'registry unavailable' }, lock, now))
  console.log('Dependency audit policy checks passed.')
} else {
  try {
    if (!process.env.npm_execpath) throw new Error('Use npm run audit:security to run this audit.')
    const result = spawnSync(process.execPath, [process.env.npm_execpath, 'audit', '--json'], {
      encoding: 'utf8', timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    })
    if (result.error || ![0, 1].includes(result.status)) {
      throw new Error('npm audit failed to run; dependency safety could not be verified.')
    }
    const report = JSON.parse(result.stdout)
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
    const blocked = blockedVulnerabilities(report, lock)
    for (const vulnerability of Object.values(report.vulnerabilities)) {
      console.log(`${vulnerability.severity}: ${vulnerability.name}`)
    }
    if (blocked.length) throw new Error(`Security audit blocked: ${blocked.map((item) => item.name).join(', ')}`)
    if (report.metadata.vulnerabilities.high) {
      console.warn(`Temporary DEV-ONLY exception: ${advisory}; expires ${expiresAt.toISOString()}.`)
    }
    console.log('Dependency security gate passed.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
