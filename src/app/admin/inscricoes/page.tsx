'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  UsersRound,
  XCircle,
} from 'lucide-react'

type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type Registration = {
  id: string
  protocol: string
  teamFaceitUrl: string
  teamName: string
  teamTag: string
  representativeName: string
  representativeEmail: string
  representativePhone: string
  teamInstagram: string | null
  discoverySource: string
  scheduleRestrictions: string | null
  logoOriginalName: string
  paymentProofOriginalName: string
  status: RegistrationStatus
  createdAt: string
  logoDownloadUrl: string
  paymentDownloadUrl: string
}

const statusLabel: Record<RegistrationStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Confirmada',
  REJECTED: 'Rejeitada',
}

const statusStyle: Record<RegistrationStatus, string> = {
  PENDING: 'bg-tr-orange/10 text-tr-orange',
  APPROVED: 'bg-copa-cyan/10 text-copa-cyan',
  REJECTED: 'bg-clutch-pink/10 text-clutch-pink',
}

const filters: Array<{ value: 'ALL' | RegistrationStatus; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'APPROVED', label: 'Confirmadas' },
  { value: 'REJECTED', label: 'Rejeitadas' },
]

export default function RegistrationsAdminPage() {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filter, setFilter] = useState<'ALL' | RegistrationStatus>('ALL')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/registrations')
      .then(async (response) => {
        if (response.status === 401) {
          router.push('/admin/login')
          return null
        }
        if (!response.ok) throw new Error('Não foi possível carregar as inscrições.')
        return response.json() as Promise<{ registrations: Registration[] }>
      })
      .then((data) => data && setRegistrations(data.registrations))
      .catch((fetchError) => setError(fetchError instanceof Error ? fetchError.message : 'Erro inesperado.'))
      .finally(() => setLoading(false))
  }, [router])

  const counts = useMemo(() => ({
    APPROVED: registrations.filter((item) => item.status === 'APPROVED').length,
    PENDING: registrations.filter((item) => item.status === 'PENDING').length,
    REJECTED: registrations.filter((item) => item.status === 'REJECTED').length,
  }), [registrations])

  const visibleRegistrations = filter === 'ALL'
    ? registrations
    : registrations.filter((item) => item.status === filter)

  async function updateStatus(id: string, status: RegistrationStatus) {
    setActionId(id)
    setError('')
    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = (await response.json()) as { error?: string; registration?: { status: RegistrationStatus } }
      if (response.status === 401) {
        router.push('/admin/login')
        return
      }
      if (!response.ok || !data.registration) {
        throw new Error(data.error || 'Não foi possível atualizar a inscrição.')
      }
      setRegistrations((current) => current.map((item) => (
        item.id === id ? { ...item, status: data.registration!.status } : item
      )))
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Erro inesperado.')
    } finally {
      setActionId('')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400">
          <ArrowLeft size={16} /> Painel administrativo
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">Copa Ace 10</p>
            <h1 className="mt-2 text-3xl font-black">Gestão das inscrições</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Confirme uma equipe para publicá-la automaticamente na página oficial. O torneio aceita até 16 equipes.</p>
          </div>
          <Link href="/copa-ace-10" target="_blank" className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-400/15">
            Ver página pública <ExternalLink size={16} />
          </Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="border border-copa-cyan/20 bg-copa-cyan/5 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-copa-cyan">Confirmadas</p>
            <p className="mt-2 text-3xl font-black">{counts.APPROVED}<span className="text-lg text-slate-500">/16</span></p>
          </div>
          <div className="border border-tr-orange/20 bg-tr-orange/5 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-tr-orange">Pendentes</p>
            <p className="mt-2 text-3xl font-black">{counts.PENDING}</p>
          </div>
          <div className="border border-clutch-pink/20 bg-clutch-pink/5 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-clutch-pink">Rejeitadas</p>
            <p className="mt-2 text-3xl font-black">{counts.REJECTED}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide transition ${filter === item.value ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {loading && <div className="mt-12 flex items-center justify-center gap-2 text-slate-400"><LoaderCircle className="animate-spin" /> Carregando...</div>}
        {error && <div role="alert" className="mt-6 border border-clutch-pink/30 bg-clutch-pink/10 p-4 text-clutch-pink">{error}</div>}
        {!loading && registrations.length === 0 && (
          <div className="mt-10 rounded-xl border border-slate-700 bg-slate-800/50 p-10 text-center text-slate-400">
            <UsersRound className="mx-auto mb-3 text-slate-500" size={36} /> Nenhuma inscrição recebida ainda.
          </div>
        )}

        <div className="mt-8 space-y-5">
          {visibleRegistrations.map((registration) => (
            <article key={registration.id} className="brand-card overflow-hidden">
              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_310px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{registration.teamName}</h2>
                    <span className="rounded bg-slate-700 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{registration.teamTag}</span>
                    <span className={`rounded px-2 py-1 text-[10px] font-black uppercase ${statusStyle[registration.status]}`}>{statusLabel[registration.status]}</span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-cyan-300">{registration.protocol}</p>
                  <a href={registration.teamFaceitUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline">Time na FACEIT <ExternalLink size={12} /></a>
                  <p className="mt-1 text-xs text-slate-500">{new Date(registration.createdAt).toLocaleString('pt-BR')}</p>
                </div>

                <div className="text-sm text-slate-300">
                  <p className="font-bold text-white">{registration.representativeName}</p>
                  <p>{registration.representativeEmail}</p>
                  <p>{registration.representativePhone}</p>
                  {registration.teamInstagram && <p>{registration.teamInstagram}</p>}
                  <p className="text-xs"><span className="font-bold text-slate-300">Conheceu por:</span> {registration.discoverySource}</p>
                  {registration.scheduleRestrictions && <p className="text-xs"><span className="font-bold text-slate-300">Restrições:</span> {registration.scheduleRestrictions}</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <a href={registration.logoDownloadUrl} className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-600"><Download size={14} /> Logo</a>
                    <a href={registration.paymentDownloadUrl} className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-600"><Download size={14} /> Comprovante</a>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-slate-700 pt-3">
                    {registration.status !== 'APPROVED' && (
                      <button type="button" disabled={actionId === registration.id || counts.APPROVED >= 16} onClick={() => updateStatus(registration.id, 'APPROVED')} className="inline-flex items-center gap-2 bg-copa-cyan px-3 py-2 text-xs font-black text-smoke hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                        {actionId === registration.id ? <LoaderCircle className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Confirmar time
                      </button>
                    )}
                    {registration.status !== 'REJECTED' && (
                      <button type="button" disabled={actionId === registration.id} onClick={() => updateStatus(registration.id, 'REJECTED')} className="inline-flex items-center gap-2 bg-clutch-pink/15 px-3 py-2 text-xs font-black text-clutch-pink hover:bg-clutch-pink/25 disabled:opacity-40">
                        <XCircle size={14} /> Rejeitar
                      </button>
                    )}
                    {registration.status !== 'PENDING' && (
                      <button type="button" disabled={actionId === registration.id} onClick={() => updateStatus(registration.id, 'PENDING')} className="inline-flex items-center gap-2 bg-tr-orange/10 px-3 py-2 text-xs font-black text-tr-orange hover:bg-tr-orange/20 disabled:opacity-40">
                        {registration.status === 'APPROVED' ? <RotateCcw size={14} /> : <Clock3 size={14} />} Voltar para pendente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
