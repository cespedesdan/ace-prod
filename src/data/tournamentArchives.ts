import { copaAce8Groups, copaAce8PlayoffRounds, copaAce8Teams } from '@/data/copaAce8'
import { copaAce7Groups, copaAce7PlayoffRounds, copaAce7Teams } from '@/data/copaAce7'
import { groups, playoffRounds, teams } from '@/data/copaAce9'
import { aceClutch1FaceitUrl, aceClutch1Rounds, aceClutch1Standings, aceClutch1Teams } from '@/data/aceClutch1'
import { aceClutch2Teams, faceitTournamentUrl, finalStandings, grandFinal, lowerBracket, upperBracket } from '@/data/aceClutch2'

export type ArchiveTeam = {
  name: string
  shortName: string
  logo?: string
  darkLogo?: boolean
}

export type ArchiveMatch = {
  label?: string
  teamA: ArchiveTeam
  teamB: ArchiveTeam
  scoreA: number
  scoreB: number
  bestOf?: 1 | 3
  href?: string
}

export type ArchiveRound = { name: string; matches: ArchiveMatch[] }

type ArchiveBase = {
  title: string
  edition: string
  description: string
  date: string
  teamCount: number
  champion: ArchiveTeam
  championLabel: 'Campeão' | 'Campeã'
  championRun: string
  summary: Array<{ place: string; label: string; team: ArchiveTeam }>
  facts?: Array<{ label: string; value: string }>
  resultText: string
  sourceLinks: Array<{ label: string; href: string }>
}

export type GroupRoundRobinArchive = ArchiveBase & {
  format: 'GROUP_ROUND_ROBIN_SINGLE_ELIMINATION'
  groups: Array<{
    name: string
    standings: Array<{
      position: number
      team: ArchiveTeam
      record: string
      wins: number
      roundDiff: number
      rounds?: number
      qualified?: boolean
    }>
  }>
  groupSubtitle: string
  playoffRounds: ArchiveRound[]
  playoffSubtitle: string
}

export type GroupDoubleEliminationArchive = ArchiveBase & {
  format: 'GROUP_DOUBLE_ELIMINATION_SINGLE_ELIMINATION'
  groupBrackets: Array<{
    name: string
    upperRounds: ArchiveRound[]
    lowerRounds: ArchiveRound[]
    qualifiers: ArchiveTeam[]
  }>
  groupSubtitle: string
  playoffRounds: ArchiveRound[]
  playoffSubtitle: string
}

export type SingleEliminationArchive = ArchiveBase & {
  format: 'SINGLE_ELIMINATION'
  standings: Array<{ place: string; team: ArchiveTeam }>
  rounds: ArchiveRound[]
  bracketSubtitle: string
}

export type DoubleEliminationArchive = ArchiveBase & {
  format: 'DOUBLE_ELIMINATION'
  standings: Array<{ place: string; team: ArchiveTeam }>
  upperRounds: ArchiveRound[]
  lowerRounds: ArchiveRound[]
  grandFinal: ArchiveMatch
  upperSubtitle: string
  lowerSubtitle: string
}

export type TournamentArchive = GroupRoundRobinArchive | GroupDoubleEliminationArchive | SingleEliminationArchive | DoubleEliminationArchive

export const tournamentArchives: Record<string, TournamentArchive> = {
  'copa-ace-7': {
    format: 'GROUP_DOUBLE_ELIMINATION_SINGLE_ELIMINATION',
    title: 'Copa Ace 7',
    edition: '7ª edição',
    description: 'Dezesseis equipes disputaram quatro grupos em dupla eliminação. A Chape e-Sports venceu a Mystic por 2–0 na grande final e terminou invicta nos playoffs.',
    date: '18 de fevereiro de 2025',
    teamCount: 16,
    champion: copaAce7Teams.chape,
    championLabel: 'Campeão',
    championRun: '3–0 nos playoffs',
    summary: [
      { place: '1º', label: 'Campeão', team: copaAce7Teams.chape },
      { place: '2º', label: 'Vice-campeão', team: copaAce7Teams.mystic },
      { place: '3º', label: 'Semifinalista', team: copaAce7Teams.azure },
      { place: '4º', label: 'Semifinalista', team: copaAce7Teams.shu },
    ],
    groupBrackets: copaAce7Groups,
    groupSubtitle: 'Dupla eliminação · todas as partidas MD1 · top 2 avançam',
    playoffRounds: copaAce7PlayoffRounds,
    playoffSubtitle: 'Eliminação simples · todas as partidas MD3',
    resultText: 'Chape e-Sports campeã · Mystic vice · 2–0',
    sourceLinks: [
      { label: 'Dados dos grupos', href: 'https://challonge.com/pt/CopaAce7/groups' },
      { label: 'Chave original', href: 'https://challonge.com/pt/CopaAce7' },
      { label: 'Playoffs na FACEIT', href: 'https://www.faceit.com/pt/championship/13e3b9ac-d077-40d1-83f8-a0218927268e/Copa%20Ace%207%20-%20PLAYOFFS' },
      { label: 'Final na FACEIT', href: 'https://www.faceit.com/pt/championship/6e40e02d-efed-45d3-b5bd-b13bde380218/Final%20-%20Copa%20Ace%207' },
    ],
  },

  'copa-ace-8': {
    format: 'GROUP_ROUND_ROBIN_SINGLE_ELIMINATION',
    title: 'Copa Ace 8',
    edition: '8ª edição',
    description: "Dezesseis equipes disputaram quatro grupos e uma chave eliminatória. A Chape e-Sports terminou invicta nos playoffs e venceu a Don't Crash por 2–1 na grande final.",
    date: '26 de maio de 2025',
    teamCount: 16,
    champion: copaAce8Teams.chape,
    championLabel: 'Campeão',
    championRun: '3–0 nos playoffs',
    summary: [
      { place: '1º', label: 'Campeão', team: copaAce8Teams.chape },
      { place: '2º', label: 'Vice-campeão', team: copaAce8Teams.dontCrash },
      { place: '3º', label: 'Semifinalista', team: copaAce8Teams.youngDreamers },
      { place: '4º', label: 'Semifinalista', team: copaAce8Teams.alzon },
    ],
    groups: copaAce8Groups,
    groupSubtitle: 'Todos contra todos · turno único · MD1 · top 2 avançam',
    playoffRounds: copaAce8PlayoffRounds,
    playoffSubtitle: 'Eliminação simples · todas as partidas MD3',
    resultText: "Chape e-Sports campeã · Don't Crash vice · 2–1",
    sourceLinks: [
      { label: 'Dados dos grupos', href: 'https://challonge.com/pt/CopaAce8/groups' },
      { label: 'Chave original', href: 'https://challonge.com/pt/CopaAce8' },
      { label: 'Grupos na FACEIT', href: 'https://www.faceit.com/pt/championship/eeb6ed38-6d8e-4fa8-b976-ae413aba89e9/COPA%20ACE%208%20-%20FASE%20DE%20GRUPOS' },
      { label: 'Playoffs na FACEIT', href: 'https://www.faceit.com/pt/championship/89ca277b-f973-4403-b7a2-ab52be3be9c5/COPA%20ACE%208%20-%20PLAYOFFS' },
    ],
  },

  'copa-ace-9': {
    format: 'GROUP_ROUND_ROBIN_SINGLE_ELIMINATION',
    title: 'Copa Ace 9',
    edition: '9ª edição',
    description: 'Dezesseis equipes, quatro grupos e uma chave eliminatória. A campanha perfeita da GodNation terminou com o título diante da Lamba Esports.',
    date: '7 de novembro de 2025',
    teamCount: 16,
    champion: teams.godNation,
    championLabel: 'Campeão',
    championRun: '3–0 nos playoffs',
    summary: [
      { place: '1º', label: 'Campeão', team: teams.godNation },
      { place: '2º', label: 'Vice-campeão', team: teams.lamba },
      { place: '3–4º', label: 'Semifinalista', team: teams.saidera },
      { place: '3–4º', label: 'Semifinalista', team: teams.choppinada },
    ],
    groups,
    groupSubtitle: 'Todos contra todos · turno único · MD1 · top 2 avançam',
    playoffRounds: playoffRounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => ({ ...match, bestOf: 3 as const })),
    })),
    playoffSubtitle: 'Eliminação simples · todas as partidas MD3',
    resultText: 'GodNation campeã · Lamba Esports vice',
    sourceLinks: [
      { label: 'Dados dos grupos', href: 'https://challonge.com/pt/CopaAce9/groups' },
      { label: 'Chave original', href: 'https://challonge.com/pt/CopaAce9' },
    ],
  },

  // Sem fase de grupos: a edição começa diretamente na chave de eliminação simples.
  'ace-clutch': {
    format: 'SINGLE_ELIMINATION',
    title: 'Ace Clutch 1',
    edition: '1ª edição',
    description: 'Treze equipes em eliminação simples. A New Icons confirmou uma campanha invicta e venceu a AMIGOS DO SDR por 2–0 na decisão.',
    date: '6 de setembro de 2025',
    teamCount: 13,
    champion: aceClutch1Teams.newIcons,
    championLabel: 'Campeã',
    championRun: '3–0 nas partidas',
    summary: [
      { place: '1º', label: 'Campeã', team: aceClutch1Teams.newIcons },
      { place: '2º', label: 'Vice-campeã', team: aceClutch1Teams.amigos },
      { place: '3º–4º', label: 'Semifinalista', team: aceClutch1Teams.godsDestiny },
      { place: '3º–4º', label: 'Semifinalista', team: aceClutch1Teams.scrouls },
    ],
    facts: [
      { label: 'Formato', value: 'Eliminação simples' },
      { label: 'Anti-cheat', value: 'Obrigatório' },
      { label: 'Chave', value: '12 jogos · 3 byes' },
      { label: 'Configuração', value: '5 contra 5' },
    ],
    standings: aceClutch1Standings,
    rounds: aceClutch1Rounds,
    bracketSubtitle: 'MD1 até as semifinais · grande final MD3',
    resultText: 'New Icons campeã · AMIGOS DO SDR vice · 2–0',
    sourceLinks: [{ label: 'Ver torneio original', href: aceClutch1FaceitUrl }],
  },

  // Sem fase de grupos: a edição começa diretamente nas chaves upper e lower.
  'ace-clutch-2': {
    format: 'DOUBLE_ELIMINATION',
    title: 'Ace Clutch 2',
    edition: '2ª edição',
    description: 'Oito equipes em uma chave de dupla eliminação. A NOX CLAN atravessou a upper invicta e venceu a Last AuAu por 2–0 na grande final.',
    date: '27 de setembro de 2025',
    teamCount: 8,
    champion: aceClutch2Teams.nox,
    championLabel: 'Campeã',
    championRun: '4–0 no torneio',
    summary: [
      { place: '1º', label: 'Campeã', team: aceClutch2Teams.nox },
      { place: '2º', label: 'Vice-campeã', team: aceClutch2Teams.lastAuAu },
      { place: '3º', label: 'Finalista lower', team: aceClutch2Teams.ufmg },
      { place: '4º', label: 'Top 4', team: aceClutch2Teams.bala },
    ],
    facts: [
      { label: 'Formato', value: 'Dupla eliminação' },
      { label: 'Anti-cheat', value: 'Obrigatório' },
      { label: 'Partidas', value: '14 confrontos' },
      { label: 'Configuração', value: '5 contra 5' },
    ],
    standings: finalStandings,
    upperRounds: upperBracket,
    lowerRounds: lowerBracket,
    grandFinal,
    upperSubtitle: '7 partidas · todas MD1',
    lowerSubtitle: '5 MD1 · final lower MD3',
    resultText: 'NOX CLAN campeã · Last AuAu vice · 2–0',
    sourceLinks: [{ label: 'Ver torneio original', href: faceitTournamentUrl }],
  },
}
