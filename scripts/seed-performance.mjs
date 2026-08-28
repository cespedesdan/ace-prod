import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

if (process.env.PERFORMANCE_FIXTURES !== 'true') {
  throw new Error('Performance fixtures require PERFORMANCE_FIXTURES=true')
}

const prisma = new PrismaClient()
const now = new Date()
const nowMs = now.getTime()
const logoSources = [
  'public/hall-of-fame/copa-ace-7/astus.webp',
  'public/hall-of-fame/copa-ace-7/atlanta.webp',
  'public/hall-of-fame/copa-ace-7/azure-bears.webp',
  'public/hall-of-fame/copa-ace-7/chape.webp',
  'public/hall-of-fame/copa-ace-7/churras-academy.webp',
  'public/hall-of-fame/copa-ace-7/corolla-peak.webp',
  'public/hall-of-fame/copa-ace-7/enigma.webp',
  'public/hall-of-fame/copa-ace-7/ezclan.webp',
  'public/hall-of-fame/copa-ace-8/alzon.webp',
  'public/hall-of-fame/copa-ace-8/bamb1nos.webp',
  'public/hall-of-fame/copa-ace-8/bloody-mindset.webp',
  'public/hall-of-fame/copa-ace-8/dont-crash.webp',
  'public/hall-of-fame/copa-ace-8/expanse.webp',
  'public/hall-of-fame/copa-ace-8/god-genesis.webp',
  'public/hall-of-fame/copa-ace-8/intense.webp',
  'public/hall-of-fame/copa-ace-8/young-dreamers.webp',
]

const teams = logoSources.map((source, index) => {
  const number = String(index + 1).padStart(2, '0')
  const id = `performance-team-${number}`
  return {
    id,
    name: `Equipe Performance ${number}`,
    nickname: `PERF ${number}`,
    avatarUrl: `/api/copa-ace-10/teams/${id}/logo`,
    faceitUrl: `https://www.faceit.com/pt/teams/00000000-0000-4000-8000-0000000000${number}`,
    status: 'checked_in',
    group: Math.floor(index / 4) + 1,
    leaderPlayerId: `leader-${number}`,
    coachPlayerId: index % 3 === 0 ? `coach-${number}` : null,
    rosterPlayerIds: Array.from({ length: 5 }, (_, player) => `player-${number}-${player + 1}`),
    substitutePlayerIds: index % 2 === 0 ? [`reserve-${number}`] : [],
    logoSource: source,
  }
})

function fixtureMatch(index) {
  const left = teams[index % teams.length]
  const right = teams[(index * 5 + 3) % teams.length]
  const finished = index < 8
  const today = index >= 8 && index < 16
  const scheduledAt = today
    ? nowMs + (index - 12) * 45 * 60_000
    : nowMs + (finished ? -(index + 1) * 86_400_000 : (index - 14) * 86_400_000)
  return {
    matchId: `performance-match-${String(index + 1).padStart(2, '0')}`,
    round: Math.floor(index / 5) + 1,
    group: null,
    bestOf: index >= 20 ? 3 : 1,
    scheduledAt,
    status: finished ? 'finished' : today && index === 8 ? 'ongoing' : 'scheduled',
    faceitUrl: `https://www.faceit.com/pt/cs2/room/1-performance-match-${index + 1}`,
    winner: finished ? 'faction1' : null,
    scores: finished ? { faction1: 13, faction2: 9 } : {},
    teams: [
      { faction: 'faction1', teamId: left.id, name: left.name, avatarUrl: left.avatarUrl },
      { faction: 'faction2', teamId: right.id, name: right.name, avatarUrl: right.avatarUrl },
    ],
  }
}

async function seedRegistrations() {
  const storageDirectory = path.join(process.cwd(), 'storage', 'registrations', 'performance')
  await mkdir(storageDirectory, { recursive: true })

  for (const [index, team] of teams.entries()) {
    const number = String(index + 1).padStart(2, '0')
    const logoPath = `performance/team-${number}.webp`
    await copyFile(path.join(process.cwd(), team.logoSource), path.join(storageDirectory, `team-${number}.webp`))
    await prisma.registration.upsert({
      where: { id: team.id },
      update: { teamName: team.name, teamTag: `P${number}`, logoPath, status: 'APPROVED' },
      create: {
        id: team.id,
        protocol: `PERFORMANCE-${number}`,
        tournament: 'Copa Ace 10',
        teamFaceitUrl: team.faceitUrl,
        faceitTeamId: team.id,
        faceitTeamNickname: team.nickname,
        faceitTeamAvatarUrl: team.avatarUrl,
        faceitLastSyncedAt: now,
        teamName: team.name,
        teamNameNormalized: team.name.toLowerCase(),
        teamTag: `P${number}`,
        representativeName: `Representante ${number}`,
        representativeEmail: `performance-${number}@example.invalid`,
        representativePhone: `+551199999${number}00`,
        discoverySource: 'Benchmark automatizado',
        rulesAccepted: true,
        logoPath,
        logoOriginalName: `team-${number}.webp`,
        paymentProofPath: `performance/payment-${number}.pdf`,
        paymentProofOriginalName: `payment-${number}.pdf`,
        status: 'APPROVED',
      },
    })
  }
}

async function seedChampionship() {
  const matches = Array.from({ length: 25 }, (_, index) => fixtureMatch(index))
  const championship = {
    tournament: 'Copa Ace 10',
    championshipId: '00000000-0000-4000-8000-000000000010',
    faceitUrl: 'https://www.faceit.com/pt/championship/00000000-0000-4000-8000-000000000010/copa-ace-10',
    name: 'Copa ACE 10 — Benchmark',
    status: 'ongoing',
    gameId: 'cs2',
    format: 'swiss',
    seedingStrategy: 'swiss',
    totalRounds: 5,
    startsAt: now,
    teamsJson: JSON.stringify(teams.map((team) => ({
      teamId: team.id,
      name: team.name,
      nickname: team.nickname,
      avatarUrl: team.avatarUrl,
      faceitUrl: team.faceitUrl,
      status: team.status,
      group: team.group,
      leaderPlayerId: team.leaderPlayerId,
      coachPlayerId: team.coachPlayerId,
      rosterPlayerIds: team.rosterPlayerIds,
      substitutePlayerIds: team.substitutePlayerIds,
    }))),
    matchesJson: JSON.stringify(matches),
    resultsJson: JSON.stringify([{ left: 1, right: 16, placements: [{ id: teams[0].id, name: teams[0].name, type: 'team' }] }]),
    syncedAt: now,
  }
  await prisma.faceitChampionship.upsert({
    where: { tournament: championship.tournament },
    update: championship,
    create: championship,
  })
}

async function seedNewsAndStream() {
  const articles = [
    ['performance-news-1', 'Copa ACE 10 reúne dezesseis equipes', 'A décima edição reúne equipes de diferentes regiões em cinco rodadas pelo sistema suíço, seguidas por uma chave eliminatória em séries melhor de três mapas. A agenda completa e os resultados ficam disponíveis no site durante toda a competição.'],
    ['performance-news-2', 'Agenda oficial já está disponível', 'Os horários da fase inicial foram publicados. As equipes podem consultar cada rodada, acompanhar partidas em andamento e rever os placares finalizados diretamente na agenda oficial.'],
    ['performance-news-3', 'Transmissão acompanha os jogos decisivos', 'A equipe da Ace Produtora prepara uma cobertura completa para as rodadas decisivas da competição, com transmissão, comentários e atualizações dos confrontos.'],
    ['performance-news-4', 'Premiação celebra a décima edição', 'A edição comemorativa distribui R$ 1.500 entre os finalistas e mantém o formato competitivo que marcou a história da Copa ACE.'],
  ]
  for (const [index, [id, title, content]] of articles.entries()) {
    await prisma.news.upsert({
      where: { id },
      update: { title, content, author: 'Ace Produtora' },
      create: { id, title, content, author: 'Ace Produtora', createdAt: new Date(nowMs - index * 86_400_000) },
    })
  }
  await prisma.liveStream.upsert({
    where: { id: 'home' },
    update: { title: 'Copa ACE 10 ao vivo', youtubeVideoId: 'M7lc1UVf-VE', visibleOnHome: true },
    create: { id: 'home', title: 'Copa ACE 10 ao vivo', youtubeVideoId: 'M7lc1UVf-VE', visibleOnHome: true },
  })
}

async function main() {
  await seedRegistrations()
  await seedChampionship()
  await seedNewsAndStream()
  console.log(`Performance fixtures ready: ${teams.length} teams, 25 matches, 4 news articles, live stream enabled.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
