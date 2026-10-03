import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash'
const source = readFileSync('scripts/deploy-production.sh', 'utf8').replaceAll('\r\n', '\n')
const helpers = source.slice(source.indexOf('fail() {'), source.indexOf('[[ "$TARGET_SHA"'))
const temp = mkdtempSync(join(tmpdir(), 'ace-backup-check-'))
const path = temp.replaceAll('\\', '/')
const run = (command) => spawnSync(bash, ['-c', `${helpers}\n${command}`], { encoding: 'utf8' })
let database
try {
  assert.equal(spawnSync(bash, ['-n', 'scripts/deploy-production.sh']).status, 0)
  database = new DatabaseSync(join(temp, 'source.db'))
  database.exec('PRAGMA journal_mode=WAL; CREATE TABLE test(value TEXT);')
  database.prepare('INSERT INTO test VALUES (?)').run('backup')
  for (const suffix of ['', '-wal']) copyFileSync(join(temp, `source.db${suffix}`), join(temp, `dev.db${suffix}`))
  const files = ['dev.db', 'dev.db-wal']
  const checksums = files.map(file => `${createHash('sha256').update(readFileSync(join(temp, file))).digest('hex')}  ${file}`).join('\n') + '\n'
  writeFileSync(join(temp, 'CHECKSUMS.sha256'), checksums)
  const valid = run(`verify_backup "${path}"`)
  assert.equal(valid.status, 0, valid.stderr)
  const repeated = run(`verify_backup "${path}"`)
  assert.equal(repeated.status, 0, `Repeated validation must preserve the backup: ${repeated.stderr}`)
  assert.notEqual(run(`require_free_space "${path}" 999999999999`).status, 0)
  writeFileSync(join(temp, 'dev.db'), 'corrupted')
  assert.notEqual(run(`verify_backup "${path}"`).status, 0)
  console.log('Deploy backup checks passed (syntax, WAL, repeated integrity, checksum and disk guard).')
} finally {
  database?.close()
  rmSync(temp, { recursive: true, force: true })
}
