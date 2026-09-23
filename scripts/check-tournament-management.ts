import assert from 'node:assert/strict'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest } from 'next/server'
import sharp from 'sharp'
import { GET as listLogos, POST as uploadLogo } from '../src/app/api/admin/tournament-logos/route'
import { adminCookieName } from '../src/lib/admin-request'
import { generateToken } from '../src/lib/auth'
import { parseTournamentInput, slugifyTournamentName, tournamentPrizeBreakdown, tournamentPrizeLabel, tournamentPublicPath, tournamentStatusLabel } from '../src/lib/tournaments'

assert.equal(slugifyTournamentName('Copa ÁCE 11'), 'copa-ace-11')
assert.equal(tournamentPublicPath('copa-ace-10'), '/copa-ace-10')
assert.equal(tournamentPublicPath('copa-ace-11'), '/campeonatos/copa-ace-11')
assert.equal(tournamentPrizeLabel('ace-clutch-3', 50000), '5 mousepads + R$ 500,00')
assert.equal(tournamentPrizeBreakdown('ace-clutch-3'), '1º lugar: R$ 350,00 · 2º lugar: R$ 150,00')
assert.equal(tournamentPrizeBreakdown('copa-ace-11'), null)
assert.equal(tournamentPrizeLabel('copa-ace-11', 150000), 'R$ 1.500,00')
assert.equal(tournamentStatusLabel('DRAFT', true), 'Inscrições abertas')
assert.equal(tournamentStatusLabel('ONGOING', false), 'Em progresso')
assert.equal(tournamentStatusLabel('COMPLETED', false), 'Finalizado')

const validInput = {
  name: 'Copa Ace 11',
  slug: '',
  description: 'Próxima edição',
  logoUrl: '/hall-of-fame/logos/copa-ace-10.webp',
  format: 'SWISS_SINGLE_ELIMINATION',
  status: 'DRAFT',
  teamLimit: 16,
  prizePoolCents: 150000,
  registrationOpen: false,
  published: false,
  startDate: '2027-01-10',
  endDate: '2027-01-20',
}
const valid = parseTournamentInput(validInput)
assert.ok('data' in valid)
if (!('data' in valid) || !valid.data) throw new Error('Valid tournament input was rejected.')
const validData = valid.data
assert.equal(validData.slug, 'copa-ace-11')
assert.equal(validData.prizePoolCents, 150000)
assert.equal(validData.registrationOpen, false)

const published = parseTournamentInput({ ...validInput, description: 'Descrição completa do campeonato.', published: true })
assert.ok('data' in published)
if (!('data' in published) || !published.data) throw new Error('Published tournament input was rejected.')
assert.equal(published.data.registrationOpen, true)

assert.ok('error' in parseTournamentInput({ ...validInput, startDate: '2027-02-01', endDate: '2027-01-01' }))
assert.ok('error' in parseTournamentInput({ ...validInput, logoUrl: 'javascript:alert(1)' }))
assert.ok('error' in parseTournamentInput({ ...validInput, published: true, description: '', logoUrl: '' }))

async function checkLogoUpload() {
  process.env.ADMIN_EMAIL ||= 'financeiro@aceprodutora.com.br'
  const token = generateToken({ id: 'test-admin', email: process.env.ADMIN_EMAIL, role: 'ADMIN' })
  const cookie = `${adminCookieName()}=${token}`
  const listResponse = await listLogos(new NextRequest('http://localhost/api/admin/tournament-logos', {
    headers: { Cookie: cookie },
  }))
  assert.equal(listResponse.status, 200)
  const listed = await listResponse.json() as { logos: string[] }
  assert.ok(listed.logos.includes('/hall-of-fame/logos/ace-clutch.webp'))

  const image = await sharp({ create: { width: 2, height: 2, channels: 4, background: '#00ffff' } }).webp().toBuffer()
  const formData = new FormData()
  formData.set('logo', new File([new Uint8Array(image)], 'logo.webp', { type: 'image/webp' }))
  const uploadResponse = await uploadLogo(new NextRequest('http://localhost/api/admin/tournament-logos', {
    method: 'POST', headers: { Cookie: cookie, Origin: 'http://localhost' }, body: formData,
  }))
  const uploaded = await uploadResponse.json() as { logoUrl?: string }
  try {
    assert.equal(uploadResponse.status, 201)
    assert.match(uploaded.logoUrl || '', /^\/hall-of-fame\/logos\/campeonato-[\w-]+\.webp$/)
  } finally {
    if (uploaded.logoUrl) await rm(path.join(process.cwd(), 'public', uploaded.logoUrl.slice(1)), { force: true })
  }
}

checkLogoUpload().then(() => console.log('Tournament management checks passed.'))
