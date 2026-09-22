'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, ExternalLink, LoaderCircle, Pencil, Play, Plus, Trophy } from 'lucide-react'
import { tournamentFormatLabels, tournamentFormats, tournamentPublicPath, tournamentStatusLabel } from '@/lib/tournaments'

type Tournament = {
  id: string
  name: string
  slug: string
  description: string
  logoUrl: string | null
  format: keyof typeof tournamentFormatLabels
  status: 'DRAFT' | 'ONGOING' | 'COMPLETED'
  teamLimit: number
  prizePoolCents: number
  registrationOpen: boolean
  published: boolean
  publishedInHallOfFame: boolean
  champion: string | null
  runnerUp: string | null
  closedAt: string | null
  reopenedAt: string | null
  lastActionBy: string | null
  startDate: string
  endDate: string
  registrationCount: number
  faceitStageCount: number
}

type FormState = {
  id: string
  name: string
  slug: string
  description: string
  logoUrl: string
  format: Tournament['format']
  status: 'DRAFT' | 'ONGOING'
  teamLimit: string
  prizePool: string
  registrationOpen: boolean
  published: boolean
  startDate: string
  endDate: string
}

const emptyForm: FormState = {
  id: '', name: '', slug: '', description: '', logoUrl: '',
  format: 'SWISS_SINGLE_ELIMINATION', status: 'DRAFT', teamLimit: '16', prizePool: '0,00',
  registrationOpen: true, published: false, startDate: '', endDate: '',
}

function dateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function moneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',')
}

function moneyCents(value: string) {
  const normalized = value.replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')
  return Math.round(Number(normalized) * 100)
}

export default function TournamentsAdminPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState('')
  const [logos, setLogos] = useState<string[]>([])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const response = await fetch('/api/admin/tournaments')
      if (response.status === 401) return router.push('/admin/login')
      const data = await response.json() as { tournaments?: Tournament[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os campeonatos.')
      setTournaments(data.tournaments || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function loadLogos() {
    const response = await fetch('/api/admin/tournament-logos')
    if (response.status === 401) return router.push('/admin/login')
    const data = await response.json() as { logos?: string[]; error?: string }
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as logos.')
    setLogos(data.logos || [])
  }

  useEffect(() => {
    void load()
    void loadLogos().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Erro inesperado.'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setError('')
    try {
      const body = new FormData()
      body.set('logo', file)
      const response = await fetch('/api/admin/tournament-logos', { method: 'POST', body })
      if (response.status === 401) return router.push('/admin/login')
      const data = await response.json() as { logoUrl?: string; error?: string }
      if (!response.ok || !data.logoUrl) throw new Error(data.error || 'Não foi possível enviar a logo.')
      const logoUrl = data.logoUrl
      setLogos((current) => [logoUrl, ...current.filter((logo) => logo !== logoUrl)])
      setForm((current) => ({ ...current, logoUrl }))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Erro inesperado.')
    } finally {
      input.value = ''
      setUploadingLogo(false)
    }
  }

  function edit(tournament: Tournament) {
    setForm({
      id: tournament.id, name: tournament.name, slug: tournament.slug,
      description: tournament.description, logoUrl: tournament.logoUrl || '', format: tournament.format,
      status: tournament.registrationOpen ? 'DRAFT' : 'ONGOING', teamLimit: String(tournament.teamLimit),
      prizePool: moneyInput(tournament.prizePoolCents), registrationOpen: tournament.registrationOpen,
      published: tournament.published, startDate: dateInput(tournament.startDate), endDate: dateInput(tournament.endDate),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function duplicate(tournament: Tournament) {
    setForm({
      id: '', name: `${tournament.name} — nova edição`, slug: '', description: tournament.description,
      logoUrl: tournament.logoUrl || '', format: tournament.format, status: 'DRAFT', teamLimit: String(tournament.teamLimit),
      prizePool: moneyInput(tournament.prizePoolCents), registrationOpen: true, published: false, startDate: '', endDate: '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/tournaments', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, action: 'update', teamLimit: Number(form.teamLimit), prizePoolCents: moneyCents(form.prizePool),
        }),
      })
      if (response.status === 401) return router.push('/admin/login')
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.')
      setForm(emptyForm)
      await load()
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  async function changeLifecycle(tournament: Tournament, action: 'close' | 'reopen') {
    let champion = ''
    let runnerUp = ''
    if (action === 'close') {
      champion = window.prompt('Nome do campeão:')?.trim() || ''
      if (!champion) return
      runnerUp = window.prompt('Nome do vice-campeão:')?.trim() || ''
      if (!runnerUp) return
      if (!window.confirm(`Encerrar ${tournament.name} com ${champion} como campeão e ${runnerUp} como vice?`)) return
    } else if (!window.confirm(`Reabrir ${tournament.name} para correções e reativar a sincronização FACEIT?`)) return

    setActionId(tournament.id)
    setError('')
    try {
      const response = await fetch('/api/admin/tournaments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tournament.id, action, champion, runnerUp }),
      })
      if (response.status === 401) return router.push('/admin/login')
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error || 'Não foi possível alterar o campeonato.')
      await load()
      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Erro inesperado.')
    } finally {
      setActionId('')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400"><ArrowLeft size={16} /> Painel administrativo</Link>
        <header className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">Estrutura competitiva</p>
          <h1 className="mt-2 text-3xl font-black">Campeonatos</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Crie edições, publique a página e encerre o torneio com um snapshot dos times e dados da FACEIT.</p>
        </header>

        {error && <div role="alert" className="mt-6 border border-clutch-pink/30 bg-clutch-pink/10 p-4 text-clutch-pink">{error}</div>}

        <form onSubmit={submit} className="brand-card mt-7 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{form.id ? 'Editar campeonato' : 'Nova edição'}</h2>
            {form.id && <button type="button" onClick={() => setForm(emptyForm)} className="text-xs font-bold text-slate-400 hover:text-white">Cancelar edição</button>}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-bold text-slate-300 lg:col-span-2">Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white" /></label>
            <label className="text-xs font-bold text-slate-300 lg:col-span-2">Endereço público <span className="text-slate-500">(opcional)</span><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="gerado pelo nome" className="mt-2 w-full bg-slate-950 px-3 py-2 text-white" /></label>
            <label className="text-xs font-bold text-slate-300 lg:col-span-4">Descrição {form.published && <span className="text-cyan-400">(obrigatória para publicar)</span>}<textarea required={form.published} minLength={form.published ? 20 : undefined} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white" /></label>
            <div className="grid gap-4 border border-white/10 bg-slate-950/50 p-4 lg:col-span-2 sm:grid-cols-[1fr_96px]">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-300">Logo do campeonato {form.published && <span className="text-cyan-400">(obrigatória para publicar)</span>}<select required={form.published} value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white"><option value="">Sem logo</option>{form.logoUrl && !logos.includes(form.logoUrl) && <option value={form.logoUrl}>Logo atual</option>}{logos.map((logo) => <option key={logo} value={logo}>{logo.split('/').pop()}</option>)}</select></label>
                <label className="block text-xs font-bold text-slate-300">Enviar nova logo <span className="font-normal text-slate-500">(PNG, JPG ou WEBP · até 10 MB)</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadingLogo} onChange={uploadLogo} className="mt-2 block w-full text-xs text-slate-400 file:mr-3 file:border-0 file:bg-copa-cyan file:px-3 file:py-2 file:font-black file:text-smoke disabled:opacity-50" /></label>
                {uploadingLogo && <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300"><LoaderCircle className="animate-spin" size={14} /> Enviando logo...</span>}
              </div>
              <div className="grid aspect-square place-items-center overflow-hidden border border-white/10 bg-black/30 p-2">
                {form.logoUrl
                  ? <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logoUrl} alt="Prévia da logo selecionada" className="h-full w-full object-contain" />
                    </>
                  : <span className="text-center text-[10px] font-bold uppercase text-slate-600">Sem logo</span>}
              </div>
            </div>
            <label className="text-xs font-bold text-slate-300 lg:col-span-2">Formato<select value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value as Tournament['format'] })} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white">{tournamentFormats.map((format) => <option key={format} value={format}>{tournamentFormatLabels[format]}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-300">Início<input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Término<input required type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Limite de times<input required type="number" min="2" max="128" value={form.teamLimit} onChange={(event) => setForm({ ...form, teamLimit: event.target.value })} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Premiação total (R$)<input required inputMode="decimal" value={form.prizePool} onChange={(event) => setForm({ ...form, prizePool: event.target.value })} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white" /></label>
            <label className="text-xs font-bold text-slate-300">Situação<select value={form.status} onChange={(event) => { const status = event.target.value as FormState['status']; setForm({ ...form, status, registrationOpen: status === 'DRAFT' }) }} className="mt-2 w-full bg-slate-950 px-3 py-2 text-white"><option value="DRAFT">Inscrições abertas</option><option value="ONGOING">Em progresso</option></select><span className="mt-1 block font-normal text-slate-500">Use “Encerrar” para marcar como finalizado.</span></label>
            <div className="flex flex-wrap items-end gap-5 lg:col-span-3">
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publicar página</label>
            </div>
          </div>
          <button disabled={saving} className="brand-button-primary mt-5 inline-flex items-center gap-2 disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />} {form.id ? 'Salvar alterações' : 'Criar campeonato'}</button>
        </form>

        <section className="mt-8 space-y-4">
          {loading && <p className="flex items-center gap-2 text-slate-400"><LoaderCircle className="animate-spin" /> Carregando...</p>}
          {tournaments.map((tournament) => (
            <article key={tournament.id} className="brand-card p-5">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">{tournament.name}</h2><span className="bg-slate-800 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{tournamentStatusLabel(tournament.status, tournament.registrationOpen)}</span>{tournament.publishedInHallOfFame && <span className="bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase text-cyan-300">Hall da Fama</span>}</div>
                  <p className="mt-2 text-sm text-slate-400">{tournamentFormatLabels[tournament.format]} · {tournament.registrationCount} inscrições · {tournament.faceitStageCount} estágios FACEIT</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(tournament.startDate).toLocaleDateString('pt-BR')} a {new Date(tournament.endDate).toLocaleDateString('pt-BR')} · R$ {moneyInput(tournament.prizePoolCents)}</p>
                  {tournament.champion && <p className="mt-2 text-sm font-bold text-cyan-300"><Trophy className="mr-1 inline" size={14} /> {tournament.champion} · vice {tournament.runnerUp}</p>}
                  {tournament.lastActionBy && <p className="mt-2 text-[10px] text-slate-600">Última ação administrativa: {tournament.lastActionBy}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`${tournamentPublicPath(tournament.slug)}${tournament.published ? '' : '?preview=1'}`} target="_blank" className="inline-flex items-center gap-1 bg-slate-800 px-3 py-2 text-xs font-bold hover:bg-slate-700">{tournament.published ? 'Página pública' : 'Visualizar prévia'} <ExternalLink size={13} /></Link>
                  <button type="button" onClick={() => edit(tournament)} disabled={tournament.status === 'COMPLETED'} className="inline-flex items-center gap-1 bg-slate-800 px-3 py-2 text-xs font-bold hover:bg-slate-700 disabled:opacity-40"><Pencil size={13} /> Editar</button>
                  <button type="button" onClick={() => duplicate(tournament)} className="inline-flex items-center gap-1 bg-slate-800 px-3 py-2 text-xs font-bold hover:bg-slate-700"><Copy size={13} /> Copiar configuração</button>
                  {tournament.status === 'COMPLETED'
                    ? <button type="button" disabled={actionId === tournament.id} onClick={() => changeLifecycle(tournament, 'reopen')} className="inline-flex items-center gap-1 bg-tr-orange/15 px-3 py-2 text-xs font-black text-tr-orange disabled:opacity-40"><Play size={13} /> Reabrir</button>
                    : <button type="button" disabled={actionId === tournament.id} onClick={() => changeLifecycle(tournament, 'close')} className="inline-flex items-center gap-1 bg-copa-cyan/15 px-3 py-2 text-xs font-black text-copa-cyan disabled:opacity-40"><Trophy size={13} /> Encerrar</button>}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
