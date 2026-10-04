import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

const scripts = process.argv.slice(2)
if (!scripts.length || scripts.some(script => !/^scripts\/check-[\w-]+\.ts$/.test(script))) {
  throw new Error('Informe um script de verificação da pasta scripts.')
}
const reports = path.join(process.cwd(), '.performance-reports')
await mkdir(reports, { recursive: true })
const directory = await mkdtemp(path.join(reports, 'ace-check-'))
if (path.dirname(path.resolve(directory)) !== path.resolve(reports)) throw new Error('Diretório de teste fora da área permitida.')
const databaseUrl = `file:${path.join(directory, 'test.db').replaceAll('\\', '/')}`
const env = {
  ...process.env, ACE_TEST_DATABASE_URL: databaseUrl, ACE_ISOLATED_TESTS: 'true',
  JWT_SECRET: 'isolated-test-only-0123456789abcdef0123456789abcdef',
  ADMIN_EMAIL: 'admin@example.invalid', TRUST_PROXY: 'false',
}
function run(args) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Verificação falhou: ${args.join(' ')}`)
}
try {
  const database = new DatabaseSync(path.join(directory, 'test.db'))
  try {
    const migrations = (await readdir('prisma/migrations', { withFileTypes: true }))
      .filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
    for (const migration of migrations) {
      database.exec(await readFile(path.join('prisma/migrations', migration, 'migration.sql'), 'utf8'))
    }
  } finally {
    database.close()
  }
  for (const script of scripts) run(['node_modules/tsx/dist/cli.mjs', script])
} finally {
  await rm(directory, { recursive: true, force: true })
}
