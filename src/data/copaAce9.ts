export type Team = {
  name: string
  shortName: string
  logo?: string
  darkLogo?: boolean
}

export type Standing = {
  position: number
  team: Team
  record: string
  wins: number
  roundDiff: number
  rounds: number
  qualified?: boolean
}

export type Group = {
  name: string
  standings: Standing[]
}

export type PlayoffMatch = {
  label?: string
  teamA: Team
  teamB: Team
  scoreA: number
  scoreB: number
}

export const teams = {
  godNation: { name: 'GodNation', shortName: 'GN', logo: '/hall-of-fame/copa-ace-9/god-nation.png' },
  azureBears: { name: 'Azure Bears', shortName: 'AB', logo: '/hall-of-fame/copa-ace-9/azure-bears.png' },
  paradox: { name: 'Paradox', shortName: 'PX', logo: '/hall-of-fame/copa-ace-9/paradox.png' },
  camarelo: { name: 'Camarelo', shortName: 'CM', logo: '/hall-of-fame/copa-ace-9/camarelo.png' },
  lamba: { name: 'Lamba Esports', shortName: 'LE', logo: '/hall-of-fame/copa-ace-9/lamba.png', darkLogo: true },
  choppinada: { name: 'Choppinada', shortName: 'CH', logo: '/hall-of-fame/copa-ace-9/choppinada.png' },
  ibiaca: { name: 'Ibiaçá', shortName: 'IB', logo: '/hall-of-fame/copa-ace-9/ibiaca.png' },
  oneVsNine: { name: '1 vs 9 Academy', shortName: '1V9', logo: '/hall-of-fame/copa-ace-9/1v9.png' },
  ghost: { name: 'Ghost Gaming', shortName: 'GG', logo: '/hall-of-fame/copa-ace-9/ghost.png' },
  brazilians: { name: 'The Brazilians', shortName: 'TB' },
  bala: { name: 'Bala de Munique', shortName: 'BM', logo: '/hall-of-fame/copa-ace-9/bala-de-munique.png' },
  nox: { name: 'Nox Clan', shortName: 'NOX' },
  saidera: { name: 'Saidera', shortName: 'SA', logo: '/hall-of-fame/copa-ace-9/saidera.png' },
  rino: { name: 'Esports Rino', shortName: 'ER', logo: '/hall-of-fame/copa-ace-9/rino.png' },
  nexon: { name: 'Nexon', shortName: 'NX' },
  outlaws: { name: 'Outlaws Gaming', shortName: 'OG', logo: '/hall-of-fame/copa-ace-9/outlaws-gaming.png' }
} satisfies Record<string, Team>

export const groups: Group[] = [
  {
    name: 'Grupo A',
    standings: [
      { position: 1, team: teams.godNation, record: '2–1', wins: 2, roundDiff: 10, rounds: 40, qualified: true },
      { position: 2, team: teams.azureBears, record: '2–1', wins: 2, roundDiff: 8, rounds: 40, qualified: true },
      { position: 3, team: teams.paradox, record: '2–1', wins: 2, roundDiff: 5, rounds: 43 },
      { position: 4, team: teams.camarelo, record: '0–3', wins: 0, roundDiff: -23, rounds: 16 }
    ]
  },
  {
    name: 'Grupo B',
    standings: [
      { position: 1, team: teams.lamba, record: '3–0', wins: 3, roundDiff: 29, rounds: 39, qualified: true },
      { position: 2, team: teams.choppinada, record: '2–1', wins: 2, roundDiff: 3, rounds: 32, qualified: true },
      { position: 3, team: teams.ibiaca, record: '1–2', wins: 1, roundDiff: -12, rounds: 18 },
      { position: 4, team: teams.oneVsNine, record: '0–3', wins: 0, roundDiff: -20, rounds: 19 }
    ]
  },
  {
    name: 'Grupo C',
    standings: [
      { position: 1, team: teams.ghost, record: '3–0', wins: 3, roundDiff: 11, rounds: 39, qualified: true },
      { position: 2, team: teams.brazilians, record: '2–1', wins: 2, roundDiff: 7, rounds: 33, qualified: true },
      { position: 3, team: teams.bala, record: '1–2', wins: 1, roundDiff: -9, rounds: 17 },
      { position: 4, team: teams.nox, record: '0–3', wins: 0, roundDiff: -9, rounds: 18 }
    ]
  },
  {
    name: 'Grupo D',
    standings: [
      { position: 1, team: teams.saidera, record: '3–0', wins: 3, roundDiff: 28, rounds: 39, qualified: true },
      { position: 2, team: teams.rino, record: '2–1', wins: 2, roundDiff: 11, rounds: 33, qualified: true },
      { position: 3, team: teams.nexon, record: '1–2', wins: 1, roundDiff: -7, rounds: 23 },
      { position: 4, team: teams.outlaws, record: '0–3', wins: 0, roundDiff: -32, rounds: 7 }
    ]
  }
]

export const playoffRounds: { name: string; matches: PlayoffMatch[] }[] = [
  {
    name: 'Quartas de final',
    matches: [
      { teamA: teams.saidera, teamB: teams.azureBears, scoreA: 2, scoreB: 0 },
      { teamA: teams.lamba, teamB: teams.brazilians, scoreA: 2, scoreB: 0 },
      { teamA: teams.ghost, teamB: teams.choppinada, scoreA: 0, scoreB: 2 },
      { teamA: teams.godNation, teamB: teams.rino, scoreA: 2, scoreB: 0 }
    ]
  },
  {
    name: 'Semifinais',
    matches: [
      { teamA: teams.lamba, teamB: teams.saidera, scoreA: 2, scoreB: 1 },
      { teamA: teams.godNation, teamB: teams.choppinada, scoreA: 2, scoreB: 0 }
    ]
  },
  {
    name: 'Grande final',
    matches: [{ label: 'Final', teamA: teams.godNation, teamB: teams.lamba, scoreA: 1, scoreB: 0 }]
  }
]
