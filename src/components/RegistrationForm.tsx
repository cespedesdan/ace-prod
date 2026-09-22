'use client'

import Image from 'next/image'
import { FormEvent, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, ImagePlus, LoaderCircle, LockKeyhole, QrCode, ShieldCheck, UploadCloud, UsersRound } from 'lucide-react'
import { MAX_REGISTRATION_FILE_SIZE } from '@/lib/registration-shared'

const PIX = '00020126580014BR.GOV.BCB.PIX0136f0f1c3b8-8afe-495c-9ea3-1302b970d582520400005303986540525.005802BR592547.933.229 GABRIEL MOTTA 6009SAO PAULO61080540900062250521NuInD0E966Xzeje4hgf2j63043F58'
const inputClass = 'mt-2 w-full border border-[#bd1159]/30 bg-[#12040a] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#8a6675] focus:border-[#ff6fae] focus:ring-2 focus:ring-[#bd1159]/15'
const labelClass = 'text-xs font-bold uppercase tracking-[0.08em] text-slate-300'

type Tournament = { name: string; logoUrl: string | null; teamLimit: number; startDate: string; endDate: string }
type FaceitTeam = {
  teamId: string
  name: string
  nickname: string | null
  members: Array<{ playerId: string; nickname: string; membershipType: string | null; isLeader: boolean; skillLevel: number | null }>
}

function date(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function RegistrationForm({ tournament }: { tournament: Tournament }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [protocol, setProtocol] = useState('')
  const [logoName, setLogoName] = useState('')
  const [proofName, setProofName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [faceitTeam, setFaceitTeam] = useState<FaceitTeam | null>(null)
  const [faceitLoading, setFaceitLoading] = useState(false)
  const [faceitError, setFaceitError] = useState('')

  function validateStep() {
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`)
    if (!section) return true
    for (const field of Array.from(section.querySelectorAll<HTMLInputElement>('input, select, textarea'))) {
      field.setCustomValidity('')
      if (!field.checkValidity()) {
        field.reportValidity()
        return false
      }
    }
    return true
  }

  function validateFile(input: HTMLInputElement, setter: (name: string) => void) {
    const file = input.files?.[0]
    input.setCustomValidity('')
    if (!file) return setter('')
    if (file.size > MAX_REGISTRATION_FILE_SIZE) {
      input.setCustomValidity('O arquivo deve ter no máximo 10 MB.')
      input.reportValidity()
      input.value = ''
      return setter('')
    }
    setter(file.name)
  }

  async function lookupFaceitTeam(url: string) {
    if (!url || faceitLoading) return
    setFaceitLoading(true)
    setFaceitError('')
    setFaceitTeam(null)
    setTeamName('')
    try {
      const response = await fetch('/api/faceit/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await response.json() as { team?: FaceitTeam; error?: string }
      if (!response.ok || !data.team) throw new Error(data.error || 'Não foi possível consultar a FACEIT.')
      setFaceitTeam(data.team)
      setTeamName(data.team.name)
    } catch (lookupError) {
      setFaceitError(lookupError instanceof Error ? lookupError.message : 'Não foi possível consultar a FACEIT.')
    } finally {
      setFaceitLoading(false)
    }
  }

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(PIX)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o código PIX abaixo.')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!validateStep()) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/registrations', { method: 'POST', body: new FormData(event.currentTarget) })
      const data = await response.json() as { success?: boolean; error?: string; protocol?: string }
      if (!response.ok || !data.success || !data.protocol) throw new Error(data.error || 'Não foi possível enviar a inscrição.')
      setProtocol(data.protocol)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar a inscrição.')
    } finally {
      setSubmitting(false)
    }
  }

  if (protocol) return (
    <main className="tournament-page copa-ace-10-page registration-page min-h-[80vh] px-4 py-16 text-white">
      <div className="registration-form mx-auto max-w-2xl p-7 text-center sm:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center border border-[#bd1159]/50 bg-[#bd1159]/10 text-[#ff6fae]"><CheckCircle2 size={42} /></span>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#ff6fae]">Inscrição recebida · {tournament.name}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Sua equipe está na lista.</h1>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-slate-400">A organização analisará os dados e anexos. Guarde seu protocolo.</p>
        <p className="mt-8 break-all border border-slate-700 bg-slate-950 px-4 py-5 font-mono text-xl font-bold text-[#ff6fae]">{protocol}</p>
      </div>
    </main>
  )

  return (
    <main className="tournament-page copa-ace-10-page registration-page min-h-screen text-white">
      <section className="tournament-hero copa10-hero registration-hero">
        <div className="copa10-hero-glow" aria-hidden="true" />
        <div className="tournament-container relative grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
          <div>
            {tournament.logoUrl && <div className="copa10-logo-lockup">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tournament.logoUrl} alt={`Logo ${tournament.name}`} />
            </div>}
            <div className="registration-open-badge mt-7 inline-flex items-center gap-2 border bg-[#bd1159]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#ff6fae]"><span className="h-2 w-2 animate-pulse bg-[#ff6fae]" /> Inscrições abertas</div>
            <h1 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-6xl">Inscreva seu time <span>na {tournament.name}</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">Cadastre sua equipe, faça o pagamento e envie os documentos para participar deste campeonato.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><UsersRound size={15} className="text-[#ff6fae]" /> Até {tournament.teamLimit} equipes</span>
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><QrCode size={15} className="text-[#ff6fae]" /> PIX · R$ 25,00</span>
            </div>
          </div>
          <aside className="registration-aside self-end border border-[#bd1159]/25 bg-black/30 p-5 backdrop-blur">
            <h2 className="font-black text-white">Antes de começar</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {[`Esteja preparado para ganhar`, `Período: ${date(tournament.startDate)} a ${date(tournament.endDate)}`, 'Time cadastrado na FACEIT', 'Logo e comprovante de pagamento'].map((item) => <li key={item} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-[#ff6fae]" /> {item}</li>)}
            </ul>
          </aside>
        </div>
      </section>

      <div className="tournament-container py-8 lg:py-12">
        <div className="registration-steps mb-7 grid grid-cols-2 overflow-hidden">
          {['Equipe', 'Pagamento'].map((label, index) => <button key={label} type="button" onClick={() => index < step && setStep(index)} className={`registration-step relative flex items-center justify-center gap-2 px-2 py-4 text-xs font-black uppercase tracking-wide transition sm:text-sm ${index === step ? 'is-active' : index < step ? 'is-complete' : 'cursor-default'}`}><span className="grid h-6 w-6 place-items-center border border-current text-[11px]">{index < step ? <Check size={13} /> : index + 1}</span>{label}</button>)}
        </div>

        <form ref={formRef} onSubmit={submit} encType="multipart/form-data" noValidate className="registration-form p-5 sm:p-8">
          <section data-step="0" className={step === 0 ? 'block' : 'hidden'}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6fae]">Etapa 1 de 2</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Equipe e representante</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><label htmlFor="teamFaceitUrl" className={labelClass}>Link do time na FACEIT</label><input id="teamFaceitUrl" name="teamFaceitUrl" type="url" required maxLength={300} pattern="https://(www\.)?faceit\.com/.*" placeholder="https://www.faceit.com/pt/teams/..." className={inputClass} onChange={() => { setFaceitTeam(null); setFaceitError(''); setTeamName('') }} onBlur={(event) => lookupFaceitTeam(event.currentTarget.value)} /></div>
              {faceitLoading && <div className="sm:col-span-2 flex items-center gap-2 border border-[#bd1159]/25 bg-[#bd1159]/10 p-3 text-sm text-[#ff6fae]"><LoaderCircle className="animate-spin" size={17} /> Consultando time e elenco...</div>}
              {faceitError && <div role="alert" className="sm:col-span-2 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{faceitError}</div>}
              {faceitTeam && <div className="sm:col-span-2 border border-[#bd1159]/25 bg-black/25 p-4"><p className="font-black text-white">{faceitTeam.name}</p><p className="text-xs text-slate-400">{faceitTeam.members.length} membros encontrados</p><ul className="mt-3 flex flex-wrap gap-2">{faceitTeam.members.map((member) => <li key={member.playerId} className="bg-white/5 px-2.5 py-1.5 text-xs text-slate-300"><strong className="text-white">{member.nickname}</strong>{member.isLeader && <span className="ml-1 text-[#ff6fae]">· líder</span>}</li>)}</ul></div>}
              <label className={labelClass}>Nome da equipe<input name="teamName" required readOnly value={teamName} placeholder="Preenchido pela FACEIT" className={`${inputClass} read-only:opacity-75`} /></label>
              <label className={labelClass}>Sigla<input name="teamTag" required minLength={2} maxLength={10} placeholder="Ex.: ACE" className={`${inputClass} uppercase`} /></label>
              <label className={labelClass}>Nome completo do representante<input name="representativeName" required minLength={5} maxLength={120} autoComplete="name" className={inputClass} /></label>
              <label className={labelClass}>E-mail<input name="representativeEmail" type="email" required maxLength={180} autoComplete="email" className={inputClass} /></label>
              <label className={`${labelClass} sm:col-span-2`}>Telefone / WhatsApp<input name="representativePhone" type="tel" required minLength={10} maxLength={24} autoComplete="tel" className={inputClass} /></label>
              <label className={labelClass}>Instagram da equipe <span className="normal-case text-slate-500">(opcional)</span><input name="teamInstagram" maxLength={100} placeholder="@suaequipe" className={inputClass} /></label>
              <label className={labelClass}>Restrições de horários <span className="normal-case text-slate-500">(opcional)</span><textarea name="scheduleRestrictions" maxLength={500} rows={3} className={`${inputClass} resize-y`} /></label>
            </div>
            <label className="registration-upload mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center"><ImagePlus className="text-[#ff6fae]" size={34} /><span className="mt-4 font-bold">Logo da equipe</span><span className="mt-1 text-xs text-slate-500">PNG, JPG ou WEBP · máximo 10 MB</span><span className="mt-4 max-w-full truncate bg-slate-800 px-3 py-2 text-xs">{logoName || 'Selecionar arquivo'}</span><input name="teamLogo" type="file" accept="image/png,image/jpeg,image/webp" required className="sr-only" onChange={(event) => validateFile(event.currentTarget, setLogoName)} /></label>
          </section>

          <section data-step="1" className={step === 1 ? 'block' : 'hidden'}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6fae]">Etapa 2 de 2</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Pagamento</h2>
            <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="registration-payment-card border border-[#bd1159]/30 p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff6fae]">Dados para pagamento</p><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Chave PIX</dt><dd className="mt-1 font-bold">financeiro@aceprodutora.com.br</dd></div><div><dt className="text-slate-500">Tipo</dt><dd className="mt-1 font-bold">E-mail</dd></div><div><dt className="text-slate-500">Banco</dt><dd className="mt-1 font-bold">Nubank</dd></div><div><dt className="text-slate-500">Valor</dt><dd className="mt-1 text-xl font-black text-[#ff6fae]">R$ 25,00</dd></div></dl><button type="button" onClick={copyPix} className="tournament-button-primary mt-6">{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'PIX copiado!' : 'Copiar PIX Copia e Cola'}</button><p className="mt-4 break-all bg-slate-950/70 p-3 font-mono text-[10px] leading-relaxed text-slate-500">{PIX}</p></div>
              <div className="bg-white p-4 text-center"><Image src="/registration/qrcode-pagamento-ace-clutch.png" alt={`QR Code para pagamento da inscrição em ${tournament.name}`} width={500} height={500} className="mx-auto h-auto w-full" /><p className="mt-3 text-xs font-black uppercase text-slate-900">Escaneie para pagar R$ 25,00</p></div>
            </div>
            <label className="registration-upload mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center"><UploadCloud className="text-[#ff6fae]" size={36} /><span className="mt-4 font-bold">Comprovante de pagamento</span><span className="mt-1 text-xs text-slate-500">Imagem ou PDF · máximo 10 MB</span><span className="mt-4 max-w-full truncate bg-slate-800 px-3 py-2 text-xs">{proofName || 'Selecionar arquivo'}</span><input name="paymentProof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required className="sr-only" onChange={(event) => validateFile(event.currentTarget, setProofName)} /></label>
            <label className="mt-6 flex cursor-pointer items-start gap-3 border border-[#bd1159]/20 bg-[#12040a]/70 p-5 text-sm text-slate-300"><input name="consent" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[#bd1159]" /><span>Confirmo que os dados são verdadeiros e que a equipe concorda com as decisões da organização.</span></label>
            <div className="mt-5 flex flex-wrap gap-5 text-xs text-slate-500"><span className="flex items-center gap-2"><LockKeyhole size={15} className="text-[#ff6fae]" /> Anexos privados</span><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#ff6fae]" /> Validação segura</span></div>
          </section>

          {error && <div role="alert" className="mt-6 border border-clutch-pink/30 bg-clutch-pink/10 px-4 py-3 text-sm font-semibold text-clutch-pink">{error}</div>}
          <div className="registration-form-actions mt-8 flex items-center justify-between border-t pt-6"><button type="button" onClick={() => setStep(0)} disabled={step === 0 || submitting} className="copa10-button-secondary disabled:invisible"><ArrowLeft size={17} /> Voltar</button>{step === 0 ? <button type="button" onClick={() => validateStep() && setStep(1)} className="tournament-button-primary">Continuar <ArrowRight size={17} /></button> : <button type="submit" disabled={submitting} className="tournament-button-primary disabled:opacity-70">{submitting ? <><LoaderCircle className="animate-spin" size={17} /> Enviando...</> : <><CheckCircle2 size={17} /> Enviar inscrição</>}</button>}</div>
        </form>
      </div>
    </main>
  )
}
