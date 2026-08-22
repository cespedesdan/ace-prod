'use client'

import Image from 'next/image'
import { FormEvent, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  UploadCloud,
  UsersRound,
} from 'lucide-react'
import { MAX_REGISTRATION_FILE_SIZE } from '@/lib/registration-shared'

const PIX_COPY_AND_PASTE = '00020126580014BR.GOV.BCB.PIX0136f0f1c3b8-8afe-495c-9ea3-1302b970d5825204000053039865406150.005802BR592547.933.229 GABRIEL MOTTA 6009SAO PAULO61080540900062250521KflodsHlbrOpXAe4hgf2j63043269'

const steps = [
  { label: 'Equipe', shortLabel: '1' },
  { label: 'Pagamento', shortLabel: '2' },
]

const inputClass =
  'mt-2 w-full border border-[#d99a28]/30 bg-[#0c0704] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#756b62] focus:border-[#ffd276] focus:ring-2 focus:ring-[#d99a28]/15'

const labelClass = 'text-xs font-bold uppercase tracking-[0.08em] text-slate-300'

type FaceitTeamPreview = {
  teamId: string
  name: string
  nickname: string | null
  members: Array<{
    playerId: string
    nickname: string
    membershipType: string | null
    isLeader: boolean
    skillLevel: number | null
  }>
}

function StepHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd276]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  )
}

export default function RegistrationForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [protocol, setProtocol] = useState('')
  const [logoName, setLogoName] = useState('')
  const [proofName, setProofName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [faceitTeam, setFaceitTeam] = useState<FaceitTeamPreview | null>(null)
  const [faceitLoading, setFaceitLoading] = useState(false)
  const [faceitError, setFaceitError] = useState('')

  function validateStep() {
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`)
    if (!section) return true

    const fields = Array.from(section.querySelectorAll<HTMLInputElement>('input, select, textarea'))
    for (const field of fields) {
      field.setCustomValidity('')
      if (!field.checkValidity()) {
        field.reportValidity()
        return false
      }
    }
    return true
  }

  function goNext() {
    setError('')
    if (validateStep()) setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function validateFile(input: HTMLInputElement, setter: (name: string) => void) {
    const file = input.files?.[0]
    input.setCustomValidity('')
    if (!file) {
      setter('')
      return
    }
    if (file.size > MAX_REGISTRATION_FILE_SIZE) {
      input.setCustomValidity('O arquivo deve ter no máximo 10 MB.')
      input.reportValidity()
      input.value = ''
      setter('')
      return
    }
    setter(file.name)
  }

  async function copyPix() {
    setError('')
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(PIX_COPY_AND_PASTE)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = PIX_COPY_AND_PASTE
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const copiedSuccessfully = document.execCommand('copy')
        textarea.remove()
        if (!copiedSuccessfully) throw new Error('Copy failed')
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o código PIX exibido abaixo.')
    }
  }

  async function lookupFaceitTeam(url: string) {
    if (!url || faceitLoading) return
    setFaceitLoading(true)
    setFaceitError('')
    setFaceitTeam(null)
    setTeamName('')
    try {
      const response = await fetch('/api/faceit/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = (await response.json()) as { team?: FaceitTeamPreview; error?: string }
      if (!response.ok || !data.team) throw new Error(data.error || 'Não foi possível consultar a FACEIT.')
      setFaceitTeam(data.team)
      setTeamName(data.team.name)
    } catch (lookupError) {
      setFaceitError(lookupError instanceof Error ? lookupError.message : 'Não foi possível consultar a FACEIT.')
    } finally {
      setFaceitLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!validateStep()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/registrations', { method: 'POST', body: new FormData(event.currentTarget) })
      const data = (await response.json()) as { success?: boolean; error?: string; protocol?: string }
      if (!response.ok || !data.success || !data.protocol) throw new Error(data.error || 'Não foi possível enviar a inscrição.')
      setProtocol(data.protocol)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar a inscrição.')
    } finally {
      setSubmitting(false)
    }
  }

  if (protocol) {
    return (
      <main className="tournament-page copa-ace-10-page registration-page min-h-[80vh] px-4 py-16 text-white">
        <div className="registration-form mx-auto max-w-2xl p-7 text-center sm:p-12">
          <span className="mx-auto grid h-20 w-20 place-items-center border border-[#d99a28]/50 bg-[#d99a28]/10 text-[#ffd276]"><CheckCircle2 size={42} /></span>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#ffd276]">Inscrição recebida</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Sua equipe está na lista.</h1>
          <p className="mx-auto mt-4 max-w-lg leading-relaxed text-slate-400">Os dados e anexos foram enviados para análise da organização. Guarde o protocolo abaixo para qualquer contato.</p>
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-950 px-4 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Protocolo</p>
            <p className="mt-2 break-all font-mono text-xl font-bold text-[#ffd276] sm:text-2xl">{protocol}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="tournament-page copa-ace-10-page registration-page min-h-screen text-white">
      <section className="tournament-hero copa10-hero registration-hero">
        <div className="copa10-hero-glow" aria-hidden="true" />
        <div className="tournament-container relative grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
          <div>
            <div className="copa10-logo-lockup"><Image src="/copa-ace-10/copa-ace-logo-10-cropped.png" alt="Copa ACE" width={583} height={235} priority /></div>
            <div className="registration-open-badge mt-7 inline-flex items-center gap-2 border bg-[#8f0000] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffd276]"><span className="h-2 w-2 animate-pulse bg-[#ffd276]" /> Inscrições Encerradas</div>
            <h1 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-6xl">Inscreva seu time <span>na Copa ACE 10</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">Cadastre sua equipe, faça o pagamento e envie os documentos para confirmar a participação na décima edição.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><UsersRound size={15} className="text-[#ffd276]" /> 16 equipes</span>
              <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-2"><QrCode size={15} className="text-[#ffd276]" /> PIX · R$ 150,00</span>
              <a href="/Regulamento_Copa_Ace_10.pdf" target="_blank" rel="noreferrer" className="copa10-button-secondary">Regulamento</a>
            </div>
          </div>
          <aside className="registration-aside self-end border border-[#d99a28]/25 bg-black/30 p-5 backdrop-blur">
            <h2 className="font-black text-white">Antes de começar</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {['Dados da equipe e time cadastrado na FACEIT', 'Logo em PNG ou JPG', 'Verifique o regulamento do torneio', 'Confira as datas do torneio no regulamento'].map((item) => (
                <li key={item} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-[#ffd276]" /> {item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/*
      <div className="tournament-container py-8 lg:py-12">
        <div className="registration-steps mb-7 grid grid-cols-2 overflow-hidden">
          {steps.map((item, index) => (
            <button key={item.label} type="button" onClick={() => index < step && setStep(index)} className={`registration-step relative flex items-center justify-center gap-2 px-2 py-4 text-xs font-black uppercase tracking-wide transition sm:text-sm ${index === step ? 'is-active' : index < step ? 'is-complete' : 'cursor-default'}`}>
              <span className="grid h-6 w-6 place-items-center border border-current text-[11px]">{index < step ? <Check size={13} /> : item.shortLabel}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" noValidate className="registration-form p-5 sm:p-8">
          <section data-step="0" className={step === 0 ? 'block' : 'hidden'}>
            <StepHeader eyebrow="Etapa 1 de 2" title="Equipe e representante" description="Informe os dados oficiais da organização, o contato responsável e envie a logo da equipe." />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="teamFaceitUrl" className={labelClass}>Link do time na FACEIT</label>
                <input id="teamFaceitUrl" name="teamFaceitUrl" type="url" required maxLength={300} pattern="https://(www\.)?faceit\.com/.*" autoComplete="url" placeholder="https://www.faceit.com/pt/teams/..." className={inputClass} onChange={() => { setFaceitTeam(null); setFaceitError(''); setTeamName('') }} onBlur={(event) => lookupFaceitTeam(event.currentTarget.value)} />
              </div>
              {faceitLoading && <div className="sm:col-span-2 flex items-center gap-2 border border-[#d99a28]/25 bg-[#d99a28]/10 p-3 text-sm text-[#ffd276]"><LoaderCircle className="animate-spin" size={17} /> Consultando time e elenco na FACEIT...</div>}
              {faceitError && <div role="alert" className="sm:col-span-2 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{faceitError}</div>}
              {faceitTeam && (
                <div className="sm:col-span-2 border border-[#d99a28]/25 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><p className="font-black text-white">{faceitTeam.name}</p><p className="text-xs text-slate-400">{faceitTeam.members.length} membros encontrados</p></div>
                    {faceitTeam.nickname && <span className="border border-[#d99a28]/30 px-2 py-1 text-[10px] font-black uppercase text-[#ffd276]">{faceitTeam.nickname}</span>}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {faceitTeam.members.map((member) => (
                      <li key={member.playerId} className="bg-white/5 px-2.5 py-1.5 text-xs text-slate-300">
                        <strong className="text-white">{member.nickname}</strong>
                        {member.isLeader && <span className="ml-1 text-[#ffd276]">· líder</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">Este elenco será salvo com a inscrição e só será atualizado pela administração.</p>
                </div>
              )}
              <label className={labelClass}>Nome da equipe<input name="teamName" required readOnly value={teamName} autoComplete="organization" placeholder="Preenchido pela FACEIT" className={`${inputClass} read-only:cursor-not-allowed read-only:opacity-75`} /></label>
              <label className={labelClass}>Sigla<input name="teamTag" required minLength={2} maxLength={10} autoComplete="off" placeholder="Ex.: ACE" className={`${inputClass} uppercase`} /></label>
              <label className={labelClass}>Nome completo do representante<input name="representativeName" required minLength={5} maxLength={120} autoComplete="name" placeholder="Nome e sobrenome" className={inputClass} /></label>
              <label className={labelClass}>E-mail<input name="representativeEmail" type="email" required maxLength={180} autoComplete="email" placeholder="contato@equipe.com" className={inputClass} /></label>
              <label className={`${labelClass} sm:col-span-2`}>Telefone / WhatsApp<input name="representativePhone" type="tel" required minLength={10} maxLength={24} autoComplete="tel" placeholder="(00) 00000-0000" className={inputClass} /></label>
              <label className={labelClass}>Instagram da equipe <span className="normal-case text-slate-500">(se houver)</span><input name="teamInstagram" maxLength={100} autoComplete="off" placeholder="@suaequipe" className={inputClass} /></label>
              <label className={labelClass}>Restrições de dias ou horários <span className="normal-case text-slate-500">(opcional)</span><textarea name="scheduleRestrictions" maxLength={500} rows={3} placeholder="Informe quando a equipe não pode jogar" className={`${inputClass} resize-y`} /></label>
            </div>

            <label className="registration-upload mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center transition">
              <ImagePlus className="text-[#ffd276]" size={34} />
              <span className="mt-4 font-bold text-white">Logo da equipe</span>
              <span className="mt-1 text-xs text-slate-500">PNG, JPG ou WEBP · máximo 10 MB</span>
              <span className="mt-4 max-w-full truncate rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 border border-[#d99a28]/30">{logoName || 'Selecionar arquivo'}</span>
              <input name="teamLogo" type="file" accept="image/png,image/jpeg,image/webp" required className="sr-only" onChange={(event) => validateFile(event.currentTarget, setLogoName)} />
            </label>
          </section>

          <section data-step="1" className={step === 1 ? 'block' : 'hidden'}>
            <StepHeader eyebrow="Etapa 2 de 2" title="Pagamento" description="Faça o PIX de R$ 150,00 e envie o comprovante para análise da organização." />
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="registration-payment-card border border-[#d99a28]/30 p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd276]">Dados para pagamento</p>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-slate-500">Chave PIX</dt><dd className="mt-1 font-bold text-white">financeiro@aceprodutora.com.br</dd></div>
                  <div><dt className="text-slate-500">Tipo</dt><dd className="mt-1 font-bold text-white">E-mail</dd></div>
                  <div><dt className="text-slate-500">Banco</dt><dd className="mt-1 font-bold text-white">Nubank</dd></div>
                  <div><dt className="text-slate-500">Valor</dt><dd className="mt-1 text-xl font-black text-[#ffd276]">R$ 150,00</dd></div>
                </dl>
                <button type="button" onClick={copyPix} className="tournament-button-primary mt-6">
                  {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'PIX copiado!' : 'Copiar PIX Copia e Cola'}
                </button>
                <p className="mt-4 break-all rounded-lg border border-slate-700 bg-slate-950/70 p-3 font-mono text-[10px] leading-relaxed text-slate-500">{PIX_COPY_AND_PASTE}</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-white p-4 text-center">
                <Image src="/registration/qrcode-pagamento-copa-ace-10.png" alt="QR Code para pagamento da inscrição da Copa ACE 10" width={500} height={500} className="mx-auto h-auto w-full" priority />
                <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-900">Escaneie para pagar</p>
              </div>
            </div>

            <label className="registration-upload mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center transition">
              <UploadCloud className="text-[#ffd276]" size={36} />
              <span className="mt-4 font-bold text-white">Comprovante de pagamento</span>
              <span className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP ou PDF · máximo 10 MB</span>
              <span className="mt-4 max-w-full truncate rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300">{proofName || 'Selecionar arquivo'}</span>
              <input name="paymentProof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required className="sr-only" onChange={(event) => validateFile(event.currentTarget, setProofName)} />
            </label>

            <div className="mt-6 border border-[#d99a28]/20 bg-[#0c0704]/70 p-5">
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-300">
                <input name="consent" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[#d99a28]" />
                <span>Confirmo que os dados são verdadeiros e que a equipe concorda com o regulamento e as decisões da organização.</span>
              </label>
            </div>

            <div className="mt-5 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
              <span className="flex items-center gap-2"><LockKeyhole size={15} className="text-[#ffd276]" /> Anexos privados</span>
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#ffd276]" /> Validação de formato</span>
              <span className="flex items-center gap-2"><FileCheck2 size={15} className="text-[#ffd276]" /> Protocolo automático</span>
            </div>
          </section>

          {error && <div role="alert" className="mt-6 border border-clutch-pink/30 bg-clutch-pink/10 px-4 py-3 text-sm font-semibold text-clutch-pink">{error}</div>}

          <div className="registration-form-actions mt-8 flex items-center justify-between border-t pt-6">
            <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0 || submitting} className="copa10-button-secondary disabled:invisible"><ArrowLeft size={17} /> Voltar</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} className="tournament-button-primary">Continuar <ArrowRight size={17} /></button>
            ) : (
              <button type="submit" disabled={submitting} className="tournament-button-primary disabled:cursor-wait disabled:opacity-70">{submitting ? <><LoaderCircle size={17} className="animate-spin" /> Enviando...</> : <><CheckCircle2 size={17} /> Enviar inscrição</>}</button>
            )}
          </div>
        </form>
      </div>
      */}
    </main>
  )
}
