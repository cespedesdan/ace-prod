import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { FaceitApiError, getFaceitChampionship } from '@/lib/faceit'
import { prisma } from '@/lib/prisma'
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'

export const runtime = 'nodejs'

function isAdmin(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value
  return Boolean(token && verifyToken(token)?.role === 'ADMIN')
}

function responseData(championship: {
  tournament: string
  championshipId: string
  faceitUrl: string
  name: string
  status: string | null
  gameId: string | null
  format: string | null
  seedingStrategy: string | null
  totalRounds: number | null
  startsAt: Date | null
  teamsJson: string
  matchesJson: string
  resultsJson: string
  syncedAt: Date
}) {
  return {
    tournament: championship.tournament,
    championshipId: championship.championshipId,
    faceitUrl: championship.faceitUrl,
    name: championship.name,
    status: championship.status,
    gameId: championship.gameId,
    format: championship.format,
    seedingStrategy: championship.seedingStrategy,
    totalRounds: championship.totalRounds,
    startsAt: championship.startsAt,
    teams: JSON.parse(championship.teamsJson),
    matches: JSON.parse(championship.matchesJson),
    results: JSON.parse(championship.resultsJson),
    syncedAt: championship.syncedAt,
  }
}

function tournamentName(value: unknown) {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().replace(/\s+/g, ' ')
    : ''
}

function revalidateTournament(tournament: string) {
  if (tournament === 'Copa Ace 10') revalidatePath('/copa-ace-10')
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  const championships = await prisma.faceitChampionship.findMany({ orderBy: { tournament: 'asc' } })
  return NextResponse.json({ championships: championships.map(responseData) })
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const body = await readJsonWithLimit<{ tournament?: unknown; faceitUrl?: unknown }>(request, 1024)
    const tournament = tournamentName(body.tournament)
    if (tournament.length < 3 || tournament.length > 100) {
      return NextResponse.json({ error: 'Informe o nome do campeonato no site.' }, { status: 400 })
    }
    if (typeof body.faceitUrl !== 'string' || body.faceitUrl.length > 500) {
      return NextResponse.json({ error: 'Informe o link do campeonato na FACEIT.' }, { status: 400 })
    }

    const snapshot = await getFaceitChampionship(body.faceitUrl)
    const syncedAt = new Date()
    const championship = await prisma.faceitChampionship.upsert({
      where: { tournament },
      create: {
        tournament,
        championshipId: snapshot.championshipId,
        faceitUrl: snapshot.faceitUrl,
        name: snapshot.name,
        status: snapshot.status,
        gameId: snapshot.gameId,
        format: snapshot.format,
        seedingStrategy: snapshot.seedingStrategy,
        totalRounds: snapshot.totalRounds,
        startsAt: snapshot.startsAt ? new Date(snapshot.startsAt) : null,
        teamsJson: JSON.stringify(snapshot.teams),
        matchesJson: JSON.stringify(snapshot.matches),
        resultsJson: JSON.stringify(snapshot.results),
        syncedAt,
      },
      update: {
        championshipId: snapshot.championshipId,
        faceitUrl: snapshot.faceitUrl,
        name: snapshot.name,
        status: snapshot.status,
        gameId: snapshot.gameId,
        format: snapshot.format,
        seedingStrategy: snapshot.seedingStrategy,
        totalRounds: snapshot.totalRounds,
        startsAt: snapshot.startsAt ? new Date(snapshot.startsAt) : null,
        teamsJson: JSON.stringify(snapshot.teams),
        matchesJson: JSON.stringify(snapshot.matches),
        resultsJson: JSON.stringify(snapshot.results),
        syncedAt,
      },
    })

    revalidateTournament(tournament)
    return NextResponse.json({ success: true, championship: responseData(championship) })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 413 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
    }
    if (error instanceof FaceitApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Este campeonato já está vinculado a outra edição.' }, { status: 409 })
    }
    console.error('FACEIT championship sync error:', error)
    return NextResponse.json({ error: 'Não foi possível sincronizar o campeonato.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const body = await readJsonWithLimit<{ tournament?: unknown }>(request, 1024)
    const tournament = tournamentName(body.tournament)
    if (!tournament) return NextResponse.json({ error: 'Informe o campeonato.' }, { status: 400 })

    const deleted = await prisma.faceitChampionship.deleteMany({ where: { tournament } })
    if (!deleted.count) return NextResponse.json({ error: 'Vínculo não encontrado.' }, { status: 404 })

    revalidateTournament(tournament)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 413 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
    }
    console.error('FACEIT championship unlink error:', error)
    return NextResponse.json({ error: 'Não foi possível desvincular o campeonato.' }, { status: 500 })
  }
}
