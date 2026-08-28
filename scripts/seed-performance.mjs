import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

if (
  process.env.PERFORMANCE_FIXTURES !== 'true'
  || process.env.CI !== 'true'
  || process.env.GITHUB_ACTIONS !== 'true'
) {
  throw new Error('Performance fixtures can only run in the isolated GitHub Actions performance job')
}

const prisma = new PrismaClient()
const now = new Date()
const nowMs = now.getTime()
const tournament = '__performance_copa_ace_10__'
const liveStreamId = '__performance_home__'
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
  const id = `ci-performance-team-${number}`
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

function fixtureMatches() {
  const campaigns = new Map(teams.map((team) => [team.id, { wins: 0, losses: 0 }]))
  const matches = []

  for (let round = 1; round <= 5; round += 1) {
    const active = teams.filter((team) => {
      const campaign = campaigns.get(team.id)
      return campaign.wins < 3 && campaign.losses < 3
    })
    const pools = new Map()
    for (const team of active) {
      const campaign = campaigns.get(team.id)
      const record = `${campaign.wins}-${campaign.losses}`
      pools.set(record, [...(pools.get(record) || []), team])
    }

    for (const pool of pools.values()) {
      for (let pair = 0; pair < pool.length; pair += 2) {
        const left = pool[pair]
        const right = pool[pair + 1]
        if (!right) throw new Error(`Invalid Swiss fixture pool in round ${round}`)
        const matchNumber = matches.length + 1
        const leftWins = (matchNumber + round) % 2 === 0
        const winner = leftWins ? left : right
        const loser = leftWins ? right : left
        const winnerFaction = leftWins ? 'faction1' : 'faction2'
        const winnerCampaign = campaigns.get(winner.id)
        const loserCampaign = campaigns.get(loser.id)
        campaigns.set(winner.id, { ...winnerCampaign, wins: winnerCampaign.wins + 1 })
        campaigns.set(loser.id, { ...loserCampaign, losses: loserCampaign.losses + 1 })
        matches.push({
          matchId: `performance-swiss-${String(matchNumber).padStart(2, '0')}`,
          round,
          group: null,
          bestOf: 1,
          scheduledAt: nowMs - (34 - matchNumber) * 3_600_000,
          status: 'finished',
          faceitUrl: `https://www.faceit.com/pt/cs2/room/1-performance-swiss-${matchNumber}`,
          winner: winnerFaction,
          scores: leftWins ? { faction1: 13, faction2: 9 } : { faction1: 9, faction2: 13 },
          teams: [
            { faction: 'faction1', teamId: left.id, name: left.name, avatarUrl: left.avatarUrl },
            { faction: 'faction2', teamId: right.id, name: right.name, avatarUrl: right.avatarUrl },
          ],
        })
      }
    }
  }

  const finalists = teams.slice(0, 8)
  for (let index = 0; index < 4; index += 1) {
    const left = finalists[index * 2]
    const right = finalists[index * 2 + 1]
    matches.push({
      matchId: `performance-playoff-${index + 1}`,
      round: null,
      group: null,
      bestOf: 3,
      scheduledAt: nowMs + (index + 1) * 3_600_000,
      status: index === 0 ? 'ongoing' : 'scheduled',
      faceitUrl: `https://www.faceit.com/pt/cs2/room/1-performance-playoff-${index + 1}`,
      winner: null,
      scores: {},
      teams: [
        { faction: 'faction1', teamId: left.id, name: left.name, avatarUrl: left.avatarUrl },
        { faction: 'faction2', teamId: right.id, name: right.name, avatarUrl: right.avatarUrl },
      ],
    })
  }

  return matches
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
      update: { tournament, teamName: team.name, teamTag: `P${number}`, logoPath, status: 'APPROVED' },
      create: {
        id: team.id,
        protocol: `CI-PERFORMANCE-${number}`,
        tournament,
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
  const matches = fixtureMatches()
  const championship = {
    tournament,
    championshipId: '00000000-0000-4000-8000-000000000999',
    faceitUrl: 'https://www.faceit.com/pt/championship/00000000-0000-4000-8000-000000000999/copa-ace-10',
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
    where: { id: liveStreamId },
    update: { title: 'Copa ACE 10 ao vivo', youtubeVideoId: 'M7lc1UVf-VE', visibleOnHome: true },
    create: { id: liveStreamId, title: 'Copa ACE 10 ao vivo', youtubeVideoId: 'M7lc1UVf-VE', visibleOnHome: true },
  })
}

async function main() {
  await seedRegistrations()
  await seedChampionship()
  await seedNewsAndStream()
  console.log(`Performance fixtures ready: ${teams.length} teams, 37 matches, 4 news articles, live stream enabled.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
