import type { Team } from '@/data/copaAce9'

export const copaAce8Teams = {
  chape: { name: 'Chape e-Sports', shortName: 'CHAPE', logo: '/hall-of-fame/copa-ace-8/chape.webp' },
  newIcons: { name: 'New Icons', shortName: 'NI', logo: '/hall-of-fame/copa-ace-8/new-icons.webp' },
  teamDelf: { name: 'Team DELF', shortName: 'DELF', logo: '/hall-of-fame/copa-ace-8/team-delf.webp' },
  youngDreamers: { name: 'Young Dreamers', shortName: 'YD', logo: '/hall-of-fame/copa-ace-8/young-dreamers.webp' },
  bloodyMindset: { name: 'Bloody Mindset', shortName: 'BM', logo: '/hall-of-fame/copa-ace-8/bloody-mindset.webp' },
  alzon: { name: 'Alzon', shortName: 'ALZ', logo: '/hall-of-fame/copa-ace-8/alzon.webp' },
  godGenesis: { name: 'God Genesis', shortName: 'GG', logo: '/hall-of-fame/copa-ace-8/god-genesis.webp' },
  intense: { name: 'Intense', shortName: 'INT', logo: '/hall-of-fame/copa-ace-8/intense.webp' },
  azureBears: { name: 'Azure Bears', shortName: 'AB', logo: '/hall-of-fame/copa-ace-8/azure-bears.webp' },
  dontCrash: { name: "Don't Crash", shortName: 'DC', logo: '/hall-of-fame/copa-ace-8/dont-crash.webp' },
  hylander: { name: 'Hylander Comédia', shortName: 'HC', logo: '/hall-of-fame/copa-ace-8/hylander-comedia.webp' },
  wifeEaters: { name: 'Wife Eaters', shortName: 'WE', logo: '/hall-of-fame/copa-ace-8/wife-eaters.webp' },
  bamb1nos: { name: 'Bamb1nos', shortName: 'B1', logo: '/hall-of-fame/copa-ace-8/bamb1nos.webp' },
  expanse: { name: 'Expanse', shortName: 'EXP', logo: '/hall-of-fame/copa-ace-8/expanse.webp' },
  juventus: { name: 'Juventus Gaming', shortName: 'JUV', logo: '/hall-of-fame/copa-ace-8/juventus.webp' },
  mystic: { name: 'Mystic', shortName: 'MYS', logo: '/hall-of-fame/copa-ace-8/mystic.webp' },
} satisfies Record<string, Team>

export const copaAce8Groups = [
  {
    name: 'Grupo A',
    standings: [
      { position: 1, team: copaAce8Teams.chape, record: '3–0', wins: 3, roundDiff: 16, qualified: true },
      { position: 2, team: copaAce8Teams.youngDreamers, record: '2–1', wins: 2, roundDiff: 11, qualified: true },
      { position: 3, team: copaAce8Teams.newIcons, record: '1–2', wins: 1, roundDiff: -14 },
      { position: 4, team: copaAce8Teams.teamDelf, record: '0–3', wins: 0, roundDiff: -13 },
    ],
  },
  {
    name: 'Grupo B',
    standings: [
      { position: 1, team: copaAce8Teams.bloodyMindset, record: '2–1', wins: 2, roundDiff: 10, qualified: true },
      { position: 2, team: copaAce8Teams.alzon, record: '2–1', wins: 2, roundDiff: 2, qualified: true },
      { position: 3, team: copaAce8Teams.godGenesis, record: '2–1', wins: 2, roundDiff: -4 },
      { position: 4, team: copaAce8Teams.intense, record: '0–3', wins: 0, roundDiff: -8 },
    ],
  },
  {
    name: 'Grupo C',
    standings: [
      { position: 1, team: copaAce8Teams.azureBears, record: '3–0', wins: 3, roundDiff: 15, qualified: true },
      { position: 2, team: copaAce8Teams.dontCrash, record: '2–1', wins: 2, roundDiff: 6, qualified: true },
      { position: 3, team: copaAce8Teams.hylander, record: '1–2', wins: 1, roundDiff: -11 },
      { position: 4, team: copaAce8Teams.wifeEaters, record: '0–3', wins: 0, roundDiff: -10 },
    ],
  },
  {
    name: 'Grupo D',
    standings: [
      { position: 1, team: copaAce8Teams.juventus, record: '2–0–1', wins: 2, roundDiff: 10, qualified: true },
      { position: 2, team: copaAce8Teams.mystic, record: '2–1', wins: 2, roundDiff: 9, qualified: true },
      { position: 3, team: copaAce8Teams.expanse, record: '1–2', wins: 1, roundDiff: 5 },
      { position: 4, team: copaAce8Teams.bamb1nos, record: '0–2–1', wins: 0, roundDiff: -24 },
    ],
  },
]

export const copaAce8PlayoffRounds = [
  {
    name: 'Quartas de final',
    matches: [
      { teamA: copaAce8Teams.azureBears, teamB: copaAce8Teams.alzon, scoreA: 0, scoreB: 2, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-556fe33e-9091-4a60-ac12-89d46224e16a' },
      { teamA: copaAce8Teams.juventus, teamB: copaAce8Teams.youngDreamers, scoreA: 0, scoreB: 2, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-eed65026-dd73-4b73-be63-0845d6c75cf7' },
      { teamA: copaAce8Teams.chape, teamB: copaAce8Teams.mystic, scoreA: 2, scoreB: 0, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-39d3203c-41e4-4b04-9cd5-a642fb8565d0' },
      { teamA: copaAce8Teams.bloodyMindset, teamB: copaAce8Teams.dontCrash, scoreA: 1, scoreB: 2, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-9f29b005-b745-4857-bbea-ffa29393dbc8' },
    ],
  },
  {
    name: 'Semifinais',
    matches: [
      { teamA: copaAce8Teams.youngDreamers, teamB: copaAce8Teams.dontCrash, scoreA: 0, scoreB: 2, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-19de9294-9950-4d32-bc17-2984340aaab9' },
      { teamA: copaAce8Teams.chape, teamB: copaAce8Teams.alzon, scoreA: 2, scoreB: 0, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-5a91b263-4302-4216-827e-739b38c0b94d' },
    ],
  },
  {
    name: 'Grande final',
    matches: [
      { label: 'Final', teamA: copaAce8Teams.chape, teamB: copaAce8Teams.dontCrash, scoreA: 2, scoreB: 1, bestOf: 3 as const, href: 'https://www.faceit.com/pt/cs2/room/1-fc033d84-5042-4877-a140-e3f94a1f0578' },
    ],
  },
]
