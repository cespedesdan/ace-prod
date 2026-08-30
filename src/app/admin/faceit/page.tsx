'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, LoaderCircle, Plus, RefreshCw, Shield, Swords, Trash2 } from 'lucide-react'

type FaceitTeam = {
  teamId: string
  name: string
  nickname: string | null
  faceitUrl: string | null
  status: string | null
  group: number | null
  coachPlayerId: string | null
}

type FaceitMatch = {
  matchId: string
  round: number | null
  group: number | null
  bestOf: number | null
  scheduledAt: number | null
  status: string | null
  faceitUrl: string | null
  winner: string | null
  scores: Record<string, number>
  teams: Array<{ faction: string; teamId: string; name: string; avatarUrl: string | null }>
}

type Championship = {
  tournament: string
  championshipId: string
  faceitUrl: string
  name: string
  status: string | null
  gameId: string | null
  format: string | null
  seedingStrategy: string | null
  totalRounds: number | null
  startsAt: string | null
  syncedAt: string
  autoSyncEnabled: boolean
  nextAutoSyncAt: string | null
  lastAutoSyncAt: string | null
  lastAutoSyncAttemptAt: string | null
  lastAutoSyncFailureAt: string | null
  lastAutoSyncError: string | null
  consecutiveAutoSyncFailures: number
  lastWebhookReceivedAt: string | null
  lastWebhookEvent: string | null
  teams: FaceitTeam[]
  matches: FaceitMatch[]
  results: Array<{
    left: number | null
    right: number | null
    placements: Array<{ id: string; name: string; type: string | null }>
  }>
}

function matchDate(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toLocaleString('pt-BR') : 'Horário a definir'
}

function syncDate(value: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Nunca'
}

export default function FaceitChampionshipAdminPage() {
  const router = useRouter()
  const [tournament, setTournament] = useState('Copa Ace 10')
  const [faceitUrl, setFaceitUrl] = useState('')
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [updatingAutoSync, setUpdatingAutoSync] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState('')
  const championship = championships.find((item) => item.tournament === tournament) || null

  useEffect(() => {
    fetch('/api/admin/faceit-championship')
      .then(async (response) => {
        if (response.status === 401) return router.push('/admin/login')
        const data = await response.json() as { championships?: Championship[]; error?: string }
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o campeonato.')
        const linked = data.championships || []
        setChampionships(linked)
        if (linked[0]) {
          setTournament(linked[0].tournament)
          setFaceitUrl(linked[0].faceitUrl)
        }
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Erro inesperado.'))
      .finally(() => setLoading(false))
  }, [router])

  const rounds = useMemo(() => {
    const grouped = new Map<string, FaceitMatch[]>()
    for (const match of championship?.matches || []) {
      const label = `Rodada ${match.round ?? '?'}${match.group !== null ? ` · Grupo ${match.group}` : ''}`
      grouped.set(label, [...(grouped.get(label) || []), match])
    }
    return [...grouped.entries()]
  }, [championship])

  async function syncChampionship(event: FormEvent) {
    event.preventDefault()
    setSyncing(true)
    setError('')
    try {
      const response = await fetch('/api/admin/faceit-championship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament, faceitUrl }),
      })
      if (response.status === 401) return router.push('/admin/login')
      const data = await response.json() as { championship?: Championship; error?: string }
      if (!response.ok || !data.championship) throw new Error(data.error || 'Não foi possível sincronizar.')
      setChampionships((current) => [...current.filter((item) => item.tournament !== data.championship!.tournament), data.championship!]
        .sort((left, right) => left.tournament.localeCompare(right.tournament, 'pt-BR')))
      setTournament(data.championship.tournament)
      setFaceitUrl(data.championship.faceitUrl)
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Erro inesperado.')
    } finally {
      setSyncing(false)
    }
  }

  async function unlinkChampionship() {
    if (!championship || !window.confirm(`Desvincular ${championship.tournament} da FACEIT? O snapshot deixará de aparecer na página integrada.`)) return
    setUnlinking(true)
    setError('')
    try {
      const response = await fetch('/api/admin/faceit-championship', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament: championship.tournament }),
      })
      if (response.status === 401) return router.push('/admin/login')
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Não foi possível desvincular.')

      const remaining = championships.filter((item) => item.tournament !== championship.tournament)
      setChampionships(remaining)
      setTournament(remaining[0]?.tournament || 'Copa Ace 10')
      setFaceitUrl(remaining[0]?.faceitUrl || '')
    } catch (unlinkError) {
      setError(unlinkError instanceof Error ? unlinkError.message : 'Erro inesperado.')
    } finally {
      setUnlinking(false)
    }
  }

  async function updateAutoSync(enabled: boolean) {
    if (!championship) return
    setUpdatingAutoSync(true)
    setError('')
    try {
      const response = await fetch('/api/admin/faceit-championship', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament: championship.tournament, autoSyncEnabled: enabled }),
      })
      if (response.status === 401) return router.push('/admin/login')
      const data = await response.json() as { championship?: Championship; error?: string }
      if (!response.ok || !data.championship) {
        throw new Error(data.error || 'Não foi possível alterar a sincronização automática.')
      }
      setChampionships((current) => current.map((item) => (
        item.tournament === data.championship!.tournament ? data.championship! : item
      )))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Erro inesperado.')
    } finally {
      setUpdatingAutoSync(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400">
          <ArrowLeft size={16} /> Painel administrativo
        </Link>

        <div className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">Integração FACEIT</p>
          <h1 className="mt-2 text-3xl font-black">Campeonatos vinculados</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Vincule cada edição ao campeonato correspondente na FACEIT. A atualização automática mantém times, partidas, horários e resultados atuais, e a sincronização manual continua disponível para atualizações imediatas.</p>
        </div>

        <form onSubmit={syncChampionship} className="brand-card mt-7 grid gap-3 p-5 lg:grid-cols-[260px_1fr_auto]">
          <label className="text-xs font-black uppercase tracking-wider text-slate-300">
            Campeonato no site
            <input type="text" required minLength={3} maxLength={100} value={tournament} onChange={(event) => setTournament(event.target.value)} placeholder="Ex.: Copa Ace 10" className="mt-2 w-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-normal normal-case text-white outline-none focus:border-cyan-400" />
          </label>
          <label className="text-xs font-black uppercase tracking-wider text-slate-300">
            Link do campeonato na FACEIT
            <input type="url" required maxLength={500} value={faceitUrl} onChange={(event) => setFaceitUrl(event.target.value)} placeholder="https://www.faceit.com/pt/championship/..." className="mt-2 w-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-normal normal-case text-white outline-none focus:border-cyan-400" />
          </label>
          <button type="submit" disabled={syncing} className="brand-button-primary self-end disabled:cursor-wait disabled:opacity-50">
            {syncing ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {championship ? `Sincronizar ${championship.tournament}` : `Vincular ${tournament || 'campeonato'}`}
          </button>
        </form>

        {loading && <p className="mt-8 flex items-center gap-2 text-slate-400"><LoaderCircle className="animate-spin" size={18} /> Carregando...</p>}
        {error && <div role="alert" className="mt-5 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        {!loading && championships.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Campeonatos vinculados">
            <button type="button" onClick={() => { setTournament(''); setFaceitUrl('') }} className="inline-flex items-center gap-2 border border-slate-700 px-3 py-2 text-xs font-black text-slate-400 hover:border-slate-500 hover:text-white">
              <Plus size={14} /> Novo vínculo
            </button>
            {championships.map((item) => (
              <button key={item.tournament} type="button" onClick={() => { setTournament(item.tournament); setFaceitUrl(item.faceitUrl) }} className={`border px-3 py-2 text-xs font-black ${item.tournament === tournament ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}>
                {item.tournament}
              </button>
            ))}
          </div>
        )}

        {championship && (
          <div className="mt-7 space-y-7">
            <section className="brand-card p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-cyan-400">{championship.status || 'Status não informado'}{championship.format ? ` · ${championship.format}` : ''}</p>
                  <h2 className="mt-2 text-2xl font-black">{championship.name}</h2>
                  <p className="mt-2 text-xs text-slate-500">Última atualização do snapshot: {new Date(championship.syncedAt).toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={championship.faceitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 hover:underline">Abrir na FACEIT <ExternalLink size={14} /></a>
                  <button type="button" disabled={unlinking} onClick={unlinkChampionship} className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 hover:bg-red-500/20 disabled:opacity-50">
                    {unlinking ? <LoaderCircle className="animate-spin" size={14} /> : <Trash2 size={14} />} Desvincular de {championship.tournament}
                  </button>
                </div>
              </div>
              <div className="mt-5 border border-slate-700 bg-slate-950/60 p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black text-white">
                      {championship.autoSyncEnabled ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-amber-400" />}
                      Sincronização automática {championship.autoSyncEnabled ? 'ativada' : 'desativada'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">A sincronização manual acima permanece disponível independentemente desta configuração.</p>
                  </div>
                  <button
                    type="button"
                    disabled={updatingAutoSync}
                    onClick={() => updateAutoSync(!championship.autoSyncEnabled)}
                    className="inline-flex items-center justify-center gap-2 border border-slate-600 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-wait disabled:opacity-50"
                  >
                    {updatingAutoSync && <LoaderCircle className="animate-spin" size={14} />}
                    {championship.autoSyncEnabled ? 'Desativar atualização automática' : 'Ativar atualização automática'}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Última automática</span><strong className="mt-1 block text-sm text-slate-200">{syncDate(championship.lastAutoSyncAt)}</strong></div>
                  <div><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Última tentativa</span><strong className="mt-1 block text-sm text-slate-200">{syncDate(championship.lastAutoSyncAttemptAt)}</strong></div>
                  <div><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Próxima automática</span><strong className="mt-1 block text-sm text-slate-200">{championship.autoSyncEnabled ? syncDate(championship.nextAutoSyncAt) : 'Desativada'}</strong></div>
                  <div><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Último webhook</span><strong className="mt-1 block text-sm text-slate-200">{syncDate(championship.lastWebhookReceivedAt)}</strong>{championship.lastWebhookEvent && <span className="mt-1 block break-all text-[10px] text-slate-500">{championship.lastWebhookEvent}</span>}</div>
                </div>
                {championship.lastAutoSyncFailureAt && (
                  <div className={`mt-4 border p-3 text-xs ${championship.consecutiveAutoSyncFailures > 0 ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-amber-500/20 bg-amber-500/5 text-amber-200'}`}>
                    <p className="font-black">{championship.consecutiveAutoSyncFailures > 0 ? 'A sincronização automática está com problema.' : 'Última falha automática — recuperada.'}</p>
                    <p className="mt-1">{syncDate(championship.lastAutoSyncFailureAt)} · {championship.lastAutoSyncError || 'Falha não detalhada.'}</p>
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="bg-slate-950 p-4"><strong className="text-2xl text-cyan-300">{championship.teams.length}</strong><span className="mt-1 block text-xs uppercase text-slate-500">Times</span></div>
                <div className="bg-slate-950 p-4"><strong className="text-2xl text-cyan-300">{championship.matches.length}</strong><span className="mt-1 block text-xs uppercase text-slate-500">Partidas</span></div>
                <div className="bg-slate-950 p-4"><strong className="text-2xl text-cyan-300">{rounds.length}</strong><span className="mt-1 block text-xs uppercase text-slate-500">Rodadas/grupos</span></div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><Shield className="text-cyan-400" size={20} /><h2 className="text-xl font-black">Times inscritos</h2></div>
              {championship.teams.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {championship.teams.map((team) => (
                    <article key={team.teamId} className="brand-card p-4">
                      {team.faceitUrl ? <a href={team.faceitUrl} target="_blank" rel="noreferrer" className="font-black hover:text-cyan-300">{team.name}</a> : <h3 className="font-black">{team.name}</h3>}
                      <p className="mt-2 text-xs text-slate-500">{team.group !== null ? `Grupo ${team.group}` : 'Grupo a definir'} · {team.status || 'status não informado'}</p>
                      {team.coachPlayerId && <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-cyan-400">Coach cadastrado</p>}
                    </article>
                  ))}
                </div>
              ) : <p className="brand-card p-5 text-sm text-slate-500">Nenhum time inscrito na FACEIT ainda.</p>}
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><Swords className="text-cyan-400" size={20} /><h2 className="text-xl font-black">Partidas e chaveamento</h2></div>
              {rounds.length ? (
                <div className="space-y-5">
                  {rounds.map(([round, matches]) => (
                    <article key={round} className="brand-card overflow-hidden">
                      <header className="border-b border-slate-700 bg-slate-950/60 px-4 py-3 text-xs font-black uppercase tracking-wider text-cyan-300">{round}</header>
                      <div className="divide-y divide-slate-700">
                        {matches.map((match) => (
                          <div key={match.matchId} className="grid gap-3 p-4 md:grid-cols-[170px_1fr_auto] md:items-center">
                            <div className="text-xs text-slate-500"><p>{matchDate(match.scheduledAt)}</p><p className="mt-1 uppercase">MD{match.bestOf || '?'} · {match.status || 'a definir'}</p></div>
                            <div className="space-y-1">
                              {match.teams.length ? match.teams.map((team) => {
                                const score = match.scores[team.faction] ?? match.scores[team.teamId]
                                const winner = match.winner === team.faction || match.winner === team.teamId
                                return <p key={team.faction} className={winner ? 'font-black text-white' : 'text-slate-300'}>{team.name}{score !== undefined ? ` — ${score}` : ''}</p>
                              }) : <p className="text-slate-500">Adversários a definir</p>}
                            </div>
                            {match.faceitUrl && <a href={match.faceitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-cyan-300 hover:underline">Partida <ExternalLink size={12} /></a>}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p className="brand-card p-5 text-sm text-slate-500">A FACEIT ainda não publicou as partidas ou o chaveamento.</p>}
            </section>

            {championship.results.some((result) => result.placements.length > 0) && (
              <section className="brand-card p-5">
                <h2 className="text-xl font-black">Resultados finais</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {championship.results.flatMap((result) => result.placements).map((placement) => (
                    <span key={`${placement.id}-${placement.name}`} className="bg-slate-950 px-3 py-2 text-sm font-bold text-slate-300">{placement.name}</span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
