export type AceClutchTeam = {
  name: string
  shortName: string
  logo?: string
  darkLogo?: boolean
}

export type AceClutchMatch = {
  label: string
  teamA: AceClutchTeam
  teamB: AceClutchTeam
  scoreA: number
  scoreB: number
  bestOf: 1 | 3
  href: string
}

export const faceitTournamentUrl = 'https://www.faceit.com/en/championship/e6423769-80c5-40bc-a0c8-9d004203efac/Ace%20Clutch%202'
const roomUrl = (id: string) => `https://www.faceit.com/en/cs2/room/${id}`

export const aceClutch2Teams = {
  dragonsWhite: { name: 'Dragons White', shortName: 'DW', logo: '/hall-of-fame/ace-clutch-2/dragons-white.webp', darkLogo: true },
  seaDragons: { name: 'SeaDragons', shortName: 'SD', logo: '/hall-of-fame/ace-clutch-2/seadragons.webp' },
  rino: { name: 'RINO E-SPORTS', shortName: 'RINO', logo: '/hall-of-fame/ace-clutch-2/rino.webp' },
  bala: { name: 'BALA DE MUNIQUE', shortName: 'BDM', logo: '/hall-of-fame/ace-clutch-2/bala-de-munique.webp' },
  lastAuAu: { name: 'Last AuAu', shortName: 'LA', logo: '/hall-of-fame/ace-clutch-2/last-auau.webp' },
  helloRebels: { name: 'Hello Rebels', shortName: 'HR', logo: '/hall-of-fame/ace-clutch-2/hello-rebels.webp' },
  nox: { name: 'NOX CLAN', shortName: 'NOX', logo: '/hall-of-fame/ace-clutch-2/nox-clan.webp' },
  ufmg: { name: 'UFMG Red Fenix', shortName: 'UFMG', logo: '/hall-of-fame/ace-clutch-2/ufmg-red-fenix.webp' },
} satisfies Record<string, AceClutchTeam>

export const finalStandings = [
  { place: '1º', team: aceClutch2Teams.nox },
  { place: '2º', team: aceClutch2Teams.lastAuAu },
  { place: '3º', team: aceClutch2Teams.ufmg },
  { place: '4º', team: aceClutch2Teams.bala },
  { place: '5º–6º', team: aceClutch2Teams.rino },
  { place: '5º–6º', team: aceClutch2Teams.helloRebels },
  { place: '7º–8º', team: aceClutch2Teams.seaDragons },
  { place: '7º–8º', team: aceClutch2Teams.dragonsWhite },
]

export const upperBracket: { name: string; matches: AceClutchMatch[] }[] = [
  {
    name: 'Primeira rodada',
    matches: [
      { label: 'UB 1', teamA: aceClutch2Teams.nox, teamB: aceClutch2Teams.seaDragons, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-ba913175-3a9a-4234-8a7a-caa95ea8a7e9') },
      { label: 'UB 2', teamA: aceClutch2Teams.rino, teamB: aceClutch2Teams.helloRebels, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-b288009f-800b-4f18-8c91-b5aaeb234649') },
      { label: 'UB 3', teamA: aceClutch2Teams.dragonsWhite, teamB: aceClutch2Teams.bala, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-b0393c5e-4fd4-49da-ab80-7ebcdfff0737') },
      { label: 'UB 4', teamA: aceClutch2Teams.lastAuAu, teamB: aceClutch2Teams.ufmg, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-0a2c02e4-7ad0-4b3c-8f98-8a463ae94831') },
    ],
  },
  {
    name: 'Semifinais upper',
    matches: [
      { label: 'UB 5', teamA: aceClutch2Teams.nox, teamB: aceClutch2Teams.helloRebels, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-2ebc0cbf-7f17-4e35-a11a-3580feda480e') },
      { label: 'UB 6', teamA: aceClutch2Teams.bala, teamB: aceClutch2Teams.lastAuAu, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-351ff21b-523f-4728-b971-f49ef8061f7d') },
    ],
  },
  {
    name: 'Final upper',
    matches: [
      { label: 'UB 7', teamA: aceClutch2Teams.nox, teamB: aceClutch2Teams.lastAuAu, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-5e9f6af3-f999-456f-8a89-abb8907a1938') },
    ],
  },
]

export const lowerBracket: { name: string; matches: AceClutchMatch[] }[] = [
  {
    name: 'Primeira rodada',
    matches: [
      { label: 'LB 1', teamA: aceClutch2Teams.seaDragons, teamB: aceClutch2Teams.rino, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-d6ff543a-5166-4439-a079-3edb65598aee') },
      { label: 'LB 2', teamA: aceClutch2Teams.dragonsWhite, teamB: aceClutch2Teams.ufmg, scoreA: 0, scoreB: 13, bestOf: 1, href: roomUrl('1-055fc361-bb93-492c-94cc-e3072091480d') },
    ],
  },
  {
    name: 'Segunda rodada',
    matches: [
      { label: 'LB 3', teamA: aceClutch2Teams.bala, teamB: aceClutch2Teams.rino, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-3007d2e5-8ae1-4cf6-90e6-43e8233aaef2') },
      { label: 'LB 4', teamA: aceClutch2Teams.helloRebels, teamB: aceClutch2Teams.ufmg, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-7f50590f-55f9-4262-8a10-f55c871c2447') },
    ],
  },
  {
    name: 'Semifinal lower',
    matches: [
      { label: 'LB 5', teamA: aceClutch2Teams.bala, teamB: aceClutch2Teams.ufmg, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-c2997f88-6e6d-4266-af8d-7f2717a741a1') },
    ],
  },
  {
    name: 'Final lower',
    matches: [
      { label: 'LB 6', teamA: aceClutch2Teams.lastAuAu, teamB: aceClutch2Teams.ufmg, scoreA: 2, scoreB: 0, bestOf: 3, href: roomUrl('1-0ce15c5b-1d6f-4374-a33a-200c710b4972') },
    ],
  },
]

export const grandFinal: AceClutchMatch = {
  label: 'Grande final',
  teamA: aceClutch2Teams.nox,
  teamB: aceClutch2Teams.lastAuAu,
  scoreA: 2,
  scoreB: 0,
  bestOf: 3,
  href: roomUrl('1-429e3d3a-c281-4726-916b-c8baf0e0f694'),
}
