import type { Team } from '@/data/copaAce9'

export const copaAce7Teams = {
  notrade: { name: 'NoTrade eSports', shortName: 'NT', logo: '/hall-of-fame/copa-ace-7/notrade.png' },
  newLegends: { name: 'New Legends', shortName: 'NL', logo: '/hall-of-fame/copa-ace-7/new-legends.png' },
  astus: { name: 'Astus Esports', shortName: 'AST', logo: '/hall-of-fame/copa-ace-7/astus.png' },
  atlanta: { name: 'Atlanta E-sports', shortName: 'ATL', logo: '/hall-of-fame/copa-ace-7/atlanta.webp' },
  ezclan: { name: 'eZClan e-Sports', shortName: 'EZ', logo: '/hall-of-fame/copa-ace-7/ezclan.webp' },
  panther: { name: 'Panther Esports', shortName: 'PTH', logo: '/hall-of-fame/copa-ace-7/panther.png' },
  minerva: { name: 'Minerva', shortName: 'MIN', logo: '/hall-of-fame/copa-ace-7/minerva.png' },
  chape: { name: 'Chape e-Sports', shortName: 'CHAPE', logo: '/hall-of-fame/copa-ace-7/chape.jpg' },
  enigma: { name: 'ENIGMA', shortName: 'ENI', logo: '/hall-of-fame/copa-ace-7/enigma.png' },
  corolla: { name: 'Corolla Peak', shortName: 'CP', logo: '/hall-of-fame/copa-ace-7/corolla-peak.webp' },
  shu: { name: 'Shu Passeios', shortName: 'SHU', logo: '/hall-of-fame/copa-ace-7/shu-passeios.png' },
  twp: { name: 'TWP', shortName: 'TWP', logo: '/hall-of-fame/copa-ace-7/twp.png' },
  mystic: { name: 'Mystic', shortName: 'MYS', logo: '/hall-of-fame/copa-ace-7/mystic.webp', darkLogo: true },
  paradox: { name: 'Paradox', shortName: 'PDX', logo: '/hall-of-fame/copa-ace-7/paradox.png' },
  churras: { name: 'Churras Academy', shortName: 'CHA', logo: '/hall-of-fame/copa-ace-7/churras-academy.png' },
  azure: { name: 'Azure Bears', shortName: 'AB', logo: '/hall-of-fame/copa-ace-7/azure-bears.png' },
} satisfies Record<string, Team>

export const copaAce7Groups = [
  {
    name: 'Grupo A',
    upperRounds: [
      {
        name: 'Abertura',
        matches: [
          { teamA: copaAce7Teams.notrade, teamB: copaAce7Teams.newLegends, scoreA: 16, scoreB: 13, bestOf: 1 as const, href: 'https://www.faceit.com/pt/cs2/room/1-954a3c16-c28e-482b-9861-9a5b8698c1d2' },
          { teamA: copaAce7Teams.astus, teamB: copaAce7Teams.atlanta, scoreA: 0, scoreB: 1, bestOf: 1 as const },
        ],
      },
      {
        name: 'Final da upper',
        matches: [{ teamA: copaAce7Teams.notrade, teamB: copaAce7Teams.atlanta, scoreA: 4, scoreB: 13, bestOf: 1 as const, href: 'https://www.faceit.com/pt/cs2/room/1-0ccd1895-6134-4d54-adc4-c9f665750e6f' }],
      },
    ],
    lowerRounds: [
      { name: 'Eliminação', matches: [{ teamA: copaAce7Teams.newLegends, teamB: copaAce7Teams.astus, scoreA: 1, scoreB: 0, bestOf: 1 as const }] },
      { name: 'Decider', matches: [{ teamA: copaAce7Teams.notrade, teamB: copaAce7Teams.newLegends, scoreA: 16, scoreB: 12, bestOf: 1 as const, href: 'https://www.faceit.com/pt/cs2/room/1-cdf40b9c-5e35-4887-8d37-d815da35ed1c' }] },
    ],
    qualifiers: [copaAce7Teams.atlanta, copaAce7Teams.notrade],
  },
  {
    name: 'Grupo B',
    upperRounds: [
      {
        name: 'Abertura',
        matches: [
          { teamA: copaAce7Teams.chape, teamB: copaAce7Teams.minerva, scoreA: 13, scoreB: 4, bestOf: 1 as const, href: 'https://www.faceit.com/pt/cs2/room/1-3079be90-e3fc-4b85-a4b7-1f507a1574cf' },
          { teamA: copaAce7Teams.panther, teamB: copaAce7Teams.ezclan, scoreA: 6, scoreB: 13, bestOf: 1 as const },
        ],
      },
      { name: 'Final da upper', matches: [{ teamA: copaAce7Teams.chape, teamB: copaAce7Teams.ezclan, scoreA: 13, scoreB: 8, bestOf: 1 as const }] },
    ],
    lowerRounds: [
      { name: 'Eliminação', matches: [{ teamA: copaAce7Teams.minerva, teamB: copaAce7Teams.panther, scoreA: 10, scoreB: 13, bestOf: 1 as const }] },
      { name: 'Decider', matches: [{ teamA: copaAce7Teams.ezclan, teamB: copaAce7Teams.panther, scoreA: 3, scoreB: 13, bestOf: 1 as const, href: 'https://www.faceit.com/pt/cs2/room/1-6b2f3f2a-1080-4549-963b-15851f329db7' }] },
    ],
    qualifiers: [copaAce7Teams.chape, copaAce7Teams.panther],
  },
  {
    name: 'Grupo C',
    upperRounds: [
      {
        name: 'Abertura',
        matches: [
          { teamA: copaAce7Teams.corolla, teamB: copaAce7Teams.enigma, scoreA: 4, scoreB: 13, bestOf: 1 as const },
          { teamA: copaAce7Teams.shu, teamB: copaAce7Teams.twp, scoreA: 13, scoreB: 4, bestOf: 1 as const },
        ],
      },
      { name: 'Final da upper', matches: [{ teamA: copaAce7Teams.enigma, teamB: copaAce7Teams.shu, scoreA: 8, scoreB: 13, bestOf: 1 as const }] },
    ],
    lowerRounds: [
      { name: 'Eliminação', matches: [{ teamA: copaAce7Teams.corolla, teamB: copaAce7Teams.twp, scoreA: 13, scoreB: 8, bestOf: 1 as const }] },
      { name: 'Decider', matches: [{ teamA: copaAce7Teams.enigma, teamB: copaAce7Teams.corolla, scoreA: 13, scoreB: 9, bestOf: 1 as const, href: 'https://www.faceit.com/pt/cs2/room/1-52b01825-8d7c-4c39-8797-d862b2d6ab77' }] },
    ],
    qualifiers: [copaAce7Teams.shu, copaAce7Teams.enigma],
  },
  {
    name: 'Grupo D',
    upperRounds: [
      {
        name: 'Abertura',
        matches: [
          { teamA: copaAce7Teams.churras, teamB: copaAce7Teams.mystic, scoreA: 9, scoreB: 13, bestOf: 1 as const },
          { teamA: copaAce7Teams.paradox, teamB: copaAce7Teams.azure, scoreA: 8, scoreB: 13, bestOf: 1 as const },
        ],
      },
      { name: 'Final da upper', matches: [{ teamA: copaAce7Teams.mystic, teamB: copaAce7Teams.azure, scoreA: 6, scoreB: 13, bestOf: 1 as const }] },
    ],
    lowerRounds: [
      { name: 'Eliminação', matches: [{ teamA: copaAce7Teams.churras, teamB: copaAce7Teams.paradox, scoreA: 18, scoreB: 22, bestOf: 1 as const }] },
      { name: 'Decider', matches: [{ teamA: copaAce7Teams.mystic, teamB: copaAce7Teams.paradox, scoreA: 13, scoreB: 11, bestOf: 1 as const }] },
    ],
    qualifiers: [copaAce7Teams.azure, copaAce7Teams.mystic],
  },
]

export const copaAce7PlayoffRounds = [
  {
    name: 'Quartas de final',
    matches: [
      { teamA: copaAce7Teams.azure, teamB: copaAce7Teams.notrade, scoreA: 2, scoreB: 0, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-3aa43565-4a79-4d57-a68d-ac2668f201c0' },
      { teamA: copaAce7Teams.chape, teamB: copaAce7Teams.enigma, scoreA: 2, scoreB: 0, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-67d9e467-b24c-49d8-89b4-3b00f660f9c7' },
      { teamA: copaAce7Teams.shu, teamB: copaAce7Teams.panther, scoreA: 2, scoreB: 0, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-41ea6894-eb8a-435b-bb1e-f9b3e6d79f98' },
      { teamA: copaAce7Teams.atlanta, teamB: copaAce7Teams.mystic, scoreA: 0, scoreB: 2, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-fcbb0102-1c6c-496f-bec0-380d8381ce06' },
    ],
  },
  {
    name: 'Semifinais',
    matches: [
      { teamA: copaAce7Teams.chape, teamB: copaAce7Teams.azure, scoreA: 2, scoreB: 0, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-f39833a8-d2cb-45e8-beab-d2a2e6569cc3' },
      { teamA: copaAce7Teams.mystic, teamB: copaAce7Teams.shu, scoreA: 2, scoreB: 1, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-292e9d9f-f3d2-46de-b695-b68b89671da0' },
    ],
  },
  {
    name: 'Grande final',
    matches: [{ label: 'Final', teamA: copaAce7Teams.mystic, teamB: copaAce7Teams.chape, scoreA: 0, scoreB: 2, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-417a08a3-d450-483c-8055-c87bc25dd38f' }],
  },
]
