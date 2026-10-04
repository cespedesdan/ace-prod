import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { NextRequest } from 'next/server'
import { POST as submitRegistration } from '../src/app/api/registrations/route'
import sitemap from '../src/app/sitemap'
import { prisma } from '../src/lib/prisma'
import { getFeaturedTournament } from '../src/lib/registration-status'
import { registrationClaimKeys, renameTournamentRegistrations } from '../src/lib/registration-claim'

assert.equal(process.env.ACE_ISOLATED_TESTS, 'true', 'Use npm run test:public-regressions.')
const originalFetch = globalThis.fetch
const teamId = randomUUID()
const uploadedIds: string[] = []
const team = {
  team_id: teamId, name: 'Time de teste',
  members: Array.from({ length: 5 }, (_, index) => ({ user_id: randomUUID(), nickname: `player-${index}` })),
}

async function main() {
  await prisma.tournament.updateMany({ data: { published: false, registrationOpen: false } })
  const a = await prisma.tournament.create({ data: {
    name: 'Campeonato A', slug: 'campeonato-a', published: true, registrationOpen: true,
    startDate: new Date('2026-10-01'), endDate: new Date('2026-10-04'),
  } })
  const b = await prisma.tournament.create({ data: {
    name: 'Campeonato B', slug: 'campeonato-b', published: true, registrationOpen: false,
    startDate: new Date('2026-10-05'), endDate: new Date('2026-10-08'),
  } })
  await prisma.tournament.create({ data: {
    name: 'Rascunho privado', slug: 'privado', published: false,
    startDate: new Date('2026-10-05'), endDate: new Date('2026-10-08'),
  } })
  assert.equal((await getFeaturedTournament())?.id, a.id)
  await prisma.tournament.update({ where: { id: a.id }, data: { registrationOpen: false, status: 'ONGOING' } })
  assert.equal((await getFeaturedTournament())?.id, a.id, 'Campeonato em progresso permanece em destaque.')
  await prisma.tournament.update({ where: { id: b.id }, data: { registrationOpen: true } })
  assert.equal((await getFeaturedTournament())?.id, b.id)
  const urls = (await sitemap()).map(entry => entry.url)
  assert.ok(urls.includes('https://aceprodutora.com.br/campeonatos/campeonato-b'))
  assert.ok(!urls.some(url => url.endsWith('/privado')))
  assert.equal(new Set(urls).size, urls.length)

  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#ffffff' } }).png().toBuffer()
  function request(id: string) {
    const body = new FormData()
    for (const [name, value] of Object.entries({
      tournamentId: id, teamFaceitUrl: `https://www.faceit.com/en/teams/${teamId}`,
      teamTag: 'TEST', representativeName: 'Representante Teste', representativeEmail: 'check@example.invalid',
      representativePhone: '21999999999', consent: 'accepted',
    })) body.set(name, value)
    body.set('teamLogo', new File([new Uint8Array(png)], 'logo.png', { type: 'image/png' }))
    body.set('paymentProof', new File([new Uint8Array(png)], 'proof.png', { type: 'image/png' }))
    return new NextRequest('http://localhost/api/registrations', { method: 'POST', body })
  }
  let calls = 0
  process.env.FACEIT_API_KEY = 'isolated-check-only'
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify(team), { headers: { 'Content-Type': 'application/json' } }) }
  assert.equal((await submitRegistration(request(a.id))).status, 409)
  assert.equal(calls, 0, 'Formulário antigo é rejeitado antes de consultar a FACEIT.')
  assert.equal(await prisma.registration.count(), 0)

  globalThis.fetch = async () => {
    await prisma.tournament.update({ where: { id: b.id }, data: { registrationOpen: false } })
    return new Response(JSON.stringify(team), { headers: { 'Content-Type': 'application/json' } })
  }
  assert.equal((await submitRegistration(request(b.id))).status, 409, 'Encerramento durante envio deve impedir a inscrição.')
  assert.equal(await prisma.registration.count(), 0)

  await prisma.tournament.update({ where: { id: b.id }, data: { registrationOpen: true } })
  globalThis.fetch = async () => new Response(JSON.stringify(team), { headers: { 'Content-Type': 'application/json' } })
  const response = await submitRegistration(request(b.id))
  assert.equal(response.status, 200)
  const active = await prisma.registration.findFirstOrThrow()
  uploadedIds.push(active.id)
  assert.equal(active.tournament, b.name)
  const { id: _id, createdAt: _created, updatedAt: _updated, ...registrationData } = active
  void _id; void _created; void _updated
  const rejected = await prisma.registration.create({ data: {
    ...registrationData, protocol: randomUUID(), status: 'REJECTED', claimKey: null, teamNameClaimKey: null,
  } })
  await prisma.$transaction(async tx => {
    await renameTournamentRegistrations(tx, b.name, 'Campeonato renomeado')
    await tx.tournament.update({ where: { id: b.id }, data: { name: 'Campeonato renomeado' } })
  })
  const claims = registrationClaimKeys('Campeonato renomeado', teamId, active.teamNameNormalized)
  const renamed = await prisma.registration.findUniqueOrThrow({ where: { id: active.id } })
  assert.equal(renamed.claimKey, claims.claimKey)
  assert.equal(renamed.teamNameClaimKey, claims.teamNameClaimKey)
  assert.equal(renamed.updatedAt.getTime(), active.updatedAt.getTime(), 'Renomeação não deve mudar a ordem de inscrição.')
  assert.equal((await prisma.registration.findUniqueOrThrow({ where: { id: rejected.id } })).claimKey, null)
  await assert.rejects(prisma.registration.create({ data: {
    ...registrationData, tournament: 'Campeonato renomeado', protocol: randomUUID(), ...claims,
  } }), (error: unknown) => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002'))
  console.log('Public regression checks passed (isolated database, mocked FACEIT).')
}

main().finally(async () => {
  globalThis.fetch = originalFetch
  await prisma.$disconnect()
  const root = path.resolve('storage', 'registrations')
  for (const id of uploadedIds) {
    const directory = path.resolve(root, id)
    if (path.dirname(directory) !== root) throw new Error('Arquivo de teste fora da área permitida.')
    await rm(directory, { recursive: true, force: true })
  }
}).catch(error => { console.error(error); process.exitCode = 1 })
