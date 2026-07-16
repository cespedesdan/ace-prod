export type AceClutch1Team = {
  name: string
  shortName: string
  logo?: string
}

export type AceClutch1Match = {
  label: string
  teamA: AceClutch1Team
  teamB: AceClutch1Team
  scoreA: number
  scoreB: number
  bestOf: 1 | 3
  href: string
}

export const aceClutch1FaceitUrl = 'https://www.faceit.com/en/championship/df04daab-1e28-4e2b-a029-ec59920e65bd/Ace%20Clutch%20-%201st%20Edition'
const roomUrl = (id: string) => `https://www.faceit.com/en/cs2/room/${id}`

export const aceClutch1Teams = {
  lunatics: { name: 'Lunatics', shortName: 'LUN', logo: '/hall-of-fame/ace-clutch-1/lunatics.png' },
  galorynhos: { name: 'GALORYNHOS', shortName: 'GAL', logo: '/hall-of-fame/ace-clutch-1/galorynhos.png' },
  godsDestiny: { name: 'Gods Destiny', shortName: 'GD', logo: '/hall-of-fame/ace-clutch-1/gods-destiny.png' },
  xiiiServers: { name: 'XIII SERVERS', shortName: 'XIII', logo: '/hall-of-fame/ace-clutch-1/xiii-servers.jpg' },
  ufmg: { name: 'UFMG Red Fenix', shortName: 'UFMG', logo: '/hall-of-fame/ace-clutch-1/ufmg-red-fenix.png' },
  scrouls: { name: 'Scrouls', shortName: 'SCR', logo: '/hall-of-fame/ace-clutch-1/scrouls.png' },
  spaceKings: { name: 'Space Kings', shortName: 'SK', logo: '/hall-of-fame/ace-clutch-1/space-kings.png' },
  newIcons: { name: 'New Icons', shortName: 'NI', logo: '/hall-of-fame/ace-clutch-1/new-icons.png' },
  nightfury: { name: 'NIGHTFURY', shortName: 'NF', logo: '/hall-of-fame/ace-clutch-1/nightfury.png' },
  pedra: { name: 'PEDRA', shortName: 'PDR', logo: '/hall-of-fame/ace-clutch-1/pedra.png' },
  amigos: { name: 'AMIGOS DO SDR', shortName: 'SDR' },
  dragonsWhite: { name: 'Dragons White', shortName: 'DW', logo: '/hall-of-fame/ace-clutch-1/dragons-white.png' },
  azureBears: { name: 'Azure Bears', shortName: 'AB', logo: '/hall-of-fame/ace-clutch-1/azure-bears.png' },
  bye: { name: 'Bye', shortName: '—' },
} satisfies Record<string, AceClutch1Team>

export const aceClutch1Standings = [
  { place: '1º', team: aceClutch1Teams.newIcons },
  { place: '2º', team: aceClutch1Teams.amigos },
  { place: '3º–4º', team: aceClutch1Teams.godsDestiny },
  { place: '3º–4º', team: aceClutch1Teams.scrouls },
  { place: '5º–8º', team: aceClutch1Teams.ufmg },
  { place: '5º–8º', team: aceClutch1Teams.azureBears },
  { place: '5º–8º', team: aceClutch1Teams.dragonsWhite },
  { place: '5º–8º', team: aceClutch1Teams.spaceKings },
  { place: '9º–13º', team: aceClutch1Teams.pedra },
  { place: '9º–13º', team: aceClutch1Teams.galorynhos },
  { place: '9º–13º', team: aceClutch1Teams.xiiiServers },
  { place: '9º–13º', team: aceClutch1Teams.nightfury },
  { place: '9º–13º', team: aceClutch1Teams.lunatics },
]

export const aceClutch1Rounds: { name: string; matches: AceClutch1Match[] }[] = [
  {
    name: 'Primeira rodada',
    matches: [
      { label: 'Partida 1 · Bye', teamA: aceClutch1Teams.godsDestiny, teamB: aceClutch1Teams.bye, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-d38f7b7d-3373-41da-9f4f-9bd0629d4566') },
      { label: 'Partida 2', teamA: aceClutch1Teams.ufmg, teamB: aceClutch1Teams.pedra, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-ec626f01-904e-4968-9437-397fe8c7f2bd') },
      { label: 'Partida 3', teamA: aceClutch1Teams.azureBears, teamB: aceClutch1Teams.galorynhos, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-233872bc-c4ad-4bab-98c8-2ae5908c27ab') },
      { label: 'Partida 4', teamA: aceClutch1Teams.amigos, teamB: aceClutch1Teams.xiiiServers, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-ddf63c0c-3dc3-4f53-a352-722792f11e6e') },
      { label: 'Partida 5 · Bye', teamA: aceClutch1Teams.scrouls, teamB: aceClutch1Teams.bye, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-bbcf566e-3eaa-4889-b7bd-69e3b37d2455') },
      { label: 'Partida 6', teamA: aceClutch1Teams.dragonsWhite, teamB: aceClutch1Teams.nightfury, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-672af81c-35a2-47fa-983b-9ae5047ebfa0') },
      { label: 'Partida 7 · Bye', teamA: aceClutch1Teams.newIcons, teamB: aceClutch1Teams.bye, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-cff63821-fe03-4e77-b41a-4d30199a5f0c') },
      { label: 'Partida 8', teamA: aceClutch1Teams.spaceKings, teamB: aceClutch1Teams.lunatics, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-8e1cb987-f874-438a-83ab-92116dc02f2c') },
    ],
  },
  {
    name: 'Quartas de final',
    matches: [
      { label: 'Partida 9', teamA: aceClutch1Teams.godsDestiny, teamB: aceClutch1Teams.ufmg, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-721dffed-f9fc-4985-beb5-6cc67c4403ba') },
      { label: 'Partida 10', teamA: aceClutch1Teams.azureBears, teamB: aceClutch1Teams.amigos, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-b2dcbd97-04b2-4545-9eda-d1e8d39426a1') },
      { label: 'Partida 11', teamA: aceClutch1Teams.scrouls, teamB: aceClutch1Teams.dragonsWhite, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-b4516251-1f87-4088-a0ae-a89633a2f04f') },
      { label: 'Partida 12', teamA: aceClutch1Teams.newIcons, teamB: aceClutch1Teams.spaceKings, scoreA: 1, scoreB: 0, bestOf: 1, href: roomUrl('1-aa68d00d-a400-45fc-b896-162e66a3923f') },
    ],
  },
  {
    name: 'Semifinais',
    matches: [
      { label: 'Partida 13', teamA: aceClutch1Teams.godsDestiny, teamB: aceClutch1Teams.amigos, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-73e0b6b8-be1c-4709-880c-372b23e4fb01') },
      { label: 'Partida 14', teamA: aceClutch1Teams.scrouls, teamB: aceClutch1Teams.newIcons, scoreA: 0, scoreB: 1, bestOf: 1, href: roomUrl('1-192b3ab8-6928-40ab-a66d-5eee16005672') },
    ],
  },
  {
    name: 'Grande final',
    matches: [
      { label: 'Partida 15', teamA: aceClutch1Teams.amigos, teamB: aceClutch1Teams.newIcons, scoreA: 0, scoreB: 2, bestOf: 3, href: roomUrl('1-7f465e1e-95a9-4117-a888-138ad8e149c3') },
    ],
  },
]
