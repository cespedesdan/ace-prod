export const tournamentFormats = [
  'SWISS_SINGLE_ELIMINATION',
  'GROUP_ROUND_ROBIN_SINGLE_ELIMINATION',
  'GROUP_DOUBLE_ELIMINATION_SINGLE_ELIMINATION',
  'SINGLE_ELIMINATION',
  'DOUBLE_ELIMINATION',
] as const

export const tournamentStatuses = ['DRAFT', 'ONGOING', 'COMPLETED'] as const

export const tournamentFormatLabels: Record<(typeof tournamentFormats)[number], string> = {
  SWISS_SINGLE_ELIMINATION: 'Suíço + eliminação simples',
  GROUP_ROUND_ROBIN_SINGLE_ELIMINATION: 'Grupos todos contra todos + eliminação simples',
  GROUP_DOUBLE_ELIMINATION_SINGLE_ELIMINATION: 'Grupos dupla eliminação + eliminação simples',
  SINGLE_ELIMINATION: 'Eliminação simples',
  DOUBLE_ELIMINATION: 'Dupla eliminação',
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().replace(/\s+/g, ' ').slice(0, maxLength)
    : ''
}

export function slugifyTournamentName(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export function tournamentPublicPath(slug: string) {
  return slug === 'copa-ace-10' ? '/copa-ace-10' : `/campeonatos/${slug}`
}

export function tournamentPrizeLabel(slug: string, prizePoolCents: number) {
  if (slug === 'ace-clutch-3') return '5 mousepads Logitech + R$ 200,00'
  return (prizePoolCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function tournamentPrizeBreakdown(slug: string) {
  return slug === 'ace-clutch-3' ? '1º lugar: R$ 125,00 · 2º lugar: R$ 75,00' : null
}

export function tournamentStatusLabel(status: string, registrationOpen: boolean) {
  if (status === 'COMPLETED') return 'Finalizado'
  return registrationOpen ? 'Inscrições abertas' : 'Em progresso'
}

function tournamentDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T12:00:00-03:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseTournamentInput(body: Record<string, unknown>) {
  const name = cleanText(body.name, 80)
  const slug = slugifyTournamentName(cleanText(body.slug, 80) || name)
  const description = cleanText(body.description, 500)
  const logoUrl = cleanText(body.logoUrl, 300)
  const startDate = tournamentDate(body.startDate)
  const endDate = tournamentDate(body.endDate)
  const teamLimit = Number(body.teamLimit)
  const prizePoolCents = Number(body.prizePoolCents)
  const format = body.format
  const status = body.status
  const published = body.published === true

  if (name.length < 3 || !slug) return { error: 'Informe um nome válido para o campeonato.' } as const
  if (!startDate || !endDate || endDate < startDate) return { error: 'Informe um período válido.' } as const
  if (!tournamentFormats.includes(format as (typeof tournamentFormats)[number])) return { error: 'Formato inválido.' } as const
  if (!tournamentStatuses.includes(status as (typeof tournamentStatuses)[number])) return { error: 'Status inválido.' } as const
  if (!Number.isInteger(teamLimit) || teamLimit < 2 || teamLimit > 128) return { error: 'O limite de times deve ficar entre 2 e 128.' } as const
  if (!Number.isInteger(prizePoolCents) || prizePoolCents < 0 || prizePoolCents > 100_000_000) return { error: 'Premiação inválida.' } as const
  if (logoUrl && !logoUrl.startsWith('/') && !/^https:\/\//i.test(logoUrl)) return { error: 'A logo deve usar um caminho interno ou uma URL HTTPS.' } as const
  if (published && description.length < 20) return { error: 'Adicione uma descrição com pelo menos 20 caracteres antes de publicar.' } as const
  if (published && !logoUrl) return { error: 'Selecione uma logo antes de publicar.' } as const

  return {
    data: {
      name,
      slug,
      description,
      logoUrl: logoUrl || null,
      format: format as (typeof tournamentFormats)[number],
      status: status as (typeof tournamentStatuses)[number],
      teamLimit,
      prizePoolCents,
      registrationOpen: status === 'DRAFT' && published,
      published,
      startDate,
      endDate,
    },
  } as const
}
