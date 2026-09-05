import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { adminCookieName, requireSameOrigin } from '@/lib/admin-request'
import { FaceitApiError } from '@/lib/faceit'
import {
  FaceitSyncInProgressError,
  isFaceitStage,
  setFaceitAutoSync,
  syncFaceitChampionship,
} from '@/lib/faceit-championship-sync'
import { prisma } from '@/lib/prisma'
import { privateJson } from '@/lib/private-response'
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'

export const runtime = 'nodejs'

function isAdmin(request: NextRequest) {
  const token = request.cookies.get(adminCookieName())?.value
  return Boolean(token && verifyToken(token)?.role === 'ADMIN')
}

function responseData(championship: {
  tournament: string
  stage: string
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
  autoSyncEnabled: boolean
  nextAutoSyncAt: Date | null
  lastAutoSyncAt: Date | null
  lastAutoSyncAttemptAt: Date | null
  lastAutoSyncFailureAt: Date | null
  lastAutoSyncError: string | null
  consecutiveAutoSyncFailures: number
}) {
  return {
    tournament: championship.tournament,
    stage: championship.stage,
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
    autoSyncEnabled: championship.autoSyncEnabled,
    nextAutoSyncAt: championship.nextAutoSyncAt,
    lastAutoSyncAt: championship.lastAutoSyncAt,
    lastAutoSyncAttemptAt: championship.lastAutoSyncAttemptAt,
    lastAutoSyncFailureAt: championship.lastAutoSyncFailureAt,
    lastAutoSyncError: championship.lastAutoSyncError,
    consecutiveAutoSyncFailures: championship.consecutiveAutoSyncFailures,
  }
}

function tournamentName(value: unknown) {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().replace(/\s+/g, ' ')
    : ''
}

function revalidateTournament(tournament: string) {
  if (tournament === 'Copa Ace 10') {
    revalidatePath('/')
    revalidatePath('/copa-ace-10')
    revalidatePath('/schedule')
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return privateJson({ error: 'Acesso negado' }, { status: 401 })
  const championships = await prisma.faceitChampionship.findMany({ orderBy: [{ tournament: 'asc' }, { stage: 'asc' }] })
  return privateJson({ championships: championships.map(responseData) })
}

export async function POST(request: NextRequest) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const body = await readJsonWithLimit<{ tournament?: unknown; stage?: unknown; faceitUrl?: unknown }>(request, 1024)
    const tournament = tournamentName(body.tournament)
    if (tournament.length < 3 || tournament.length > 100) {
      return NextResponse.json({ error: 'Informe o nome do campeonato no site.' }, { status: 400 })
    }
    if (typeof body.faceitUrl !== 'string' || body.faceitUrl.length > 500) {
      return NextResponse.json({ error: 'Informe o link do campeonato na FACEIT.' }, { status: 400 })
    }
    if (!isFaceitStage(body.stage)) {
      return NextResponse.json({ error: 'Informe o estágio do campeonato.' }, { status: 400 })
    }

    const championship = await syncFaceitChampionship({
      tournament,
      stage: body.stage,
      faceitUrl: body.faceitUrl,
      trigger: 'manual',
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
    if (error instanceof FaceitApiError || error instanceof FaceitSyncInProgressError) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof FaceitApiError ? error.status : 409 },
      )
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Este campeonato já está vinculado a outra edição.' }, { status: 409 })
    }
    console.error('FACEIT championship sync error:', error)
    return NextResponse.json({ error: 'Não foi possível sincronizar o campeonato.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const body = await readJsonWithLimit<{ tournament?: unknown; stage?: unknown; autoSyncEnabled?: unknown }>(request, 1024)
    const tournament = tournamentName(body.tournament)
    if (!tournament || !isFaceitStage(body.stage) || typeof body.autoSyncEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Configuração de sincronização inválida.' }, { status: 400 })
    }

    const championship = await setFaceitAutoSync(tournament, body.stage, body.autoSyncEnabled)
    return NextResponse.json({ success: true, championship: responseData(championship) })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 413 })
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Vínculo não encontrado.' }, { status: 404 })
    }
    console.error('FACEIT automatic sync configuration error:', error)
    return NextResponse.json({ error: 'Não foi possível alterar a sincronização automática.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const body = await readJsonWithLimit<{ tournament?: unknown; stage?: unknown }>(request, 1024)
    const tournament = tournamentName(body.tournament)
    if (!tournament || !isFaceitStage(body.stage)) return NextResponse.json({ error: 'Informe o campeonato e o estágio.' }, { status: 400 })

    const deleted = await prisma.faceitChampionship.deleteMany({ where: { tournament, stage: body.stage } })
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
