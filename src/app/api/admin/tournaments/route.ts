import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { adminCookieName, requireSameOrigin } from '@/lib/admin-request'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { privateJson } from '@/lib/private-response'
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'
import { parseTournamentInput } from '@/lib/tournaments'

function adminPayload(request: NextRequest) {
  const token = request.cookies.get(adminCookieName())?.value
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

function revalidateTournament(slug: string) {
  revalidatePath('/', 'layout')
  revalidatePath('/hall-of-fame')
  revalidatePath(`/campeonatos/${slug}`)
}

export async function GET(request: NextRequest) {
  if (!adminPayload(request)) return privateJson({ error: 'Acesso negado' }, { status: 401 })

  const [tournaments, registrationCounts, faceitCounts] = await Promise.all([
    prisma.tournament.findMany({ orderBy: [{ startDate: 'desc' }, { name: 'asc' }] }),
    prisma.registration.groupBy({ by: ['tournament'], _count: { _all: true } }),
    prisma.faceitChampionship.groupBy({ by: ['tournament'], _count: { _all: true } }),
  ])
  const registrations = new Map(registrationCounts.map((item) => [item.tournament, item._count._all]))
  const faceit = new Map(faceitCounts.map((item) => [item.tournament, item._count._all]))

  return privateJson({
    tournaments: tournaments.map((tournament) => ({
      ...tournament,
      finalSnapshotJson: undefined,
      registrationCount: registrations.get(tournament.name) || 0,
      faceitStageCount: faceit.get(tournament.name) || 0,
    })),
  })
}

export async function POST(request: NextRequest) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin
  const admin = adminPayload(request)
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const body = await readJsonWithLimit<Record<string, unknown>>(request, 8 * 1024)
    const parsed = parseTournamentInput(body)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    if (parsed.data.status === 'COMPLETED') return NextResponse.json({ error: 'Use a ação de encerramento para concluir o campeonato.' }, { status: 400 })

    const tournament = await prisma.$transaction(async (tx) => {
      if (parsed.data.registrationOpen) {
        await tx.tournament.updateMany({ data: { registrationOpen: false } })
      }
      return tx.tournament.create({ data: { ...parsed.data, lastActionBy: admin.email } })
    })
    revalidateTournament(tournament.slug)
    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError || error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um campeonato com este nome ou endereço.' }, { status: 409 })
    }
    console.error('Tournament create error:', error)
    return NextResponse.json({ error: 'Não foi possível criar o campeonato.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin
  const admin = adminPayload(request)
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const body = await readJsonWithLimit<Record<string, unknown>>(request, 8 * 1024)
    const id = typeof body.id === 'string' ? body.id : ''
    const action = typeof body.action === 'string' ? body.action : 'update'
    const existing = id ? await prisma.tournament.findUnique({ where: { id } }) : null
    if (!existing) return NextResponse.json({ error: 'Campeonato não encontrado.' }, { status: 404 })

    if (action === 'close') {
      if (existing.status === 'COMPLETED') return NextResponse.json({ error: 'O campeonato já está encerrado.' }, { status: 409 })
      const champion = typeof body.champion === 'string' ? body.champion.normalize('NFKC').trim().slice(0, 80) : ''
      const runnerUp = typeof body.runnerUp === 'string' ? body.runnerUp.normalize('NFKC').trim().slice(0, 80) : ''
      if (champion.length < 2 || runnerUp.length < 2 || champion.toLowerCase() === runnerUp.toLowerCase()) {
        return NextResponse.json({ error: 'Informe campeão e vice-campeão diferentes.' }, { status: 400 })
      }

      const tournament = await prisma.$transaction(async (tx) => {
        const [teams, championships] = await Promise.all([
          tx.registration.findMany({
            where: { tournament: existing.name, status: 'APPROVED' },
            orderBy: { updatedAt: 'asc' },
            select: { id: true, teamName: true, teamTag: true, faceitTeamId: true },
          }),
          tx.faceitChampionship.findMany({
            where: { tournament: existing.name },
            orderBy: { stage: 'asc' },
            select: {
              stage: true, championshipId: true, faceitUrl: true, name: true, status: true,
              teamsJson: true, matchesJson: true, resultsJson: true, syncedAt: true,
            },
          }),
        ])
        const closedAt = new Date()
        const updated = await tx.tournament.update({
          where: { id },
          data: {
            status: 'COMPLETED', registrationOpen: false, published: true,
            publishedInHallOfFame: true, champion, runnerUp, closedAt,
            lastActionBy: admin.email,
            finalSnapshotJson: JSON.stringify({ closedAt, champion, runnerUp, teams, championships }),
          },
        })
        await tx.faceitChampionship.updateMany({
          where: { tournament: existing.name },
          data: { autoSyncEnabled: false, nextAutoSyncAt: null, autoSyncLeaseUntil: null, autoSyncLeaseToken: null },
        })
        return updated
      })
      revalidateTournament(tournament.slug)
      return NextResponse.json({ tournament })
    }

    if (action === 'reopen') {
      if (existing.status !== 'COMPLETED') return NextResponse.json({ error: 'O campeonato ainda não está encerrado.' }, { status: 409 })
      const tournament = await prisma.$transaction(async (tx) => {
        const reopened = await tx.tournament.update({
          where: { id },
          data: {
            status: 'ONGOING', publishedInHallOfFame: false, champion: null, runnerUp: null,
            reopenedAt: new Date(), lastActionBy: admin.email,
          },
        })
        await tx.faceitChampionship.updateMany({
          where: { tournament: existing.name },
          data: { autoSyncEnabled: true, nextAutoSyncAt: new Date(), terminalStatusObservedAt: null },
        })
        return reopened
      })
      revalidateTournament(tournament.slug)
      return NextResponse.json({ tournament })
    }

    if (action !== 'update') return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
    if (existing.status === 'COMPLETED') return NextResponse.json({ error: 'Reabra o campeonato antes de editá-lo.' }, { status: 409 })
    const parsed = parseTournamentInput(body)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    if (parsed.data.status === 'COMPLETED') return NextResponse.json({ error: 'Use a ação de encerramento para concluir o campeonato.' }, { status: 400 })

    const tournament = await prisma.$transaction(async (tx) => {
      if (parsed.data.registrationOpen) {
        await tx.tournament.updateMany({ where: { id: { not: id } }, data: { registrationOpen: false } })
      }
      if (existing.name !== parsed.data.name) {
        await tx.registration.updateMany({ where: { tournament: existing.name }, data: { tournament: parsed.data.name } })
        await tx.faceitChampionship.updateMany({ where: { tournament: existing.name }, data: { tournament: parsed.data.name } })
      }
      return tx.tournament.update({ where: { id }, data: { ...parsed.data, lastActionBy: admin.email } })
    })
    revalidateTournament(existing.slug)
    revalidateTournament(tournament.slug)
    return NextResponse.json({ tournament })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError || error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Nome, endereço ou vínculo já utilizado por outro campeonato.' }, { status: 409 })
    }
    console.error('Tournament update error:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar o campeonato.' }, { status: 500 })
  }
}
