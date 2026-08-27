import assert from 'node:assert/strict'
import nextConfig from '../next.config.mjs'

const rules = await nextConfig.headers()
const globalRule = rules.find((rule) => rule.source === '/(.*)')
const csp = globalRule?.headers.find(
  (header) => header.key === 'Content-Security-Policy-Report-Only',
)?.value

assert.ok(csp)
assert.match(csp, /object-src 'none'/)
assert.match(csp, /frame-ancestors 'none'/)
assert.match(csp, /base-uri 'self'/)

console.log('Security header checks passed.')
