export interface HallOfFameEdition {
  slug: string
  title: string
  logo: string
  date?: string
  champion: string
  runnerUp: string
  description: string
  highlights: string[]
  status?: 'completed' | 'ongoing'
  href?: string
}

export const hallOfFameEditions: HallOfFameEdition[] = [
  {
    slug: 'copa-ace-1',
    title: 'Copa Ace 1',
    logo: '/hall-of-fame/logos/copa-ace-1.png',
    champion: 'Kamía Orgánosi',
    runnerUp: 'Zebus UFTM',
    description: 'A primeira edição da Copa Ace marcou o início da tradição do campeonato.',
    highlights: ['Primeira edição', 'Início da história da competição', 'Resumo em construção']
  },
  {
    slug: 'copa-ace-2',
    title: 'Copa Ace 2',
    logo: '/hall-of-fame/logos/copa-ace-2-5.png',
    champion: 'PoucoPapo',
    runnerUp: 'Wizard',
    description: 'A segunda edição consolidou a Copa Ace como um dos principais torneios da estrutura.',
    highlights: ['Evolução da competição', 'Novo campeão', 'Resumo em construção']
  },
  {
    slug: 'copa-ace-3',
    title: 'Copa Ace 3',
    logo: '/hall-of-fame/logos/copa-ace-2-5.png',
    champion: 'WorkHard eSports',
    runnerUp: 'Wizard Gaming',
    description: 'A terceira edição trouxe mais competitividade e reforçou a relevância do torneio.',
    highlights: ['Competição mais equilibrada', 'Novos protagonistas', 'Resumo em construção']
  },
  {
    slug: 'copa-ace-4',
    title: 'Copa Ace 4',
    logo: '/hall-of-fame/logos/copa-ace-2-5.png',
    champion: 'Jaguares Astro',
    runnerUp: 'Brasa Gaming',
    description: 'Mais uma edição histórica, com uma disputa intensa entre os times do campeonato.',
    highlights: ['Momento decisivo', 'Final memorável', 'Resumo em construção']
  },
  {
    slug: 'copa-ace-5',
    title: 'Copa Ace 5',
    logo: '/hall-of-fame/logos/copa-ace-2-5.png',
    champion: 'Madness',
    runnerUp: 'Totale Gaming Academy',
    description: 'A quinta edição consolidou a Copa Ace como referência em performances e rivalidades.',
    highlights: ['Grande disputa', 'Marca histórica', 'Resumo em construção']
  },
  {
    slug: 'copa-ace-6',
    title: 'Copa Ace 6',
    logo: '/hall-of-fame/logos/copa-ace-6-7.png',
    champion: 'Blackhat',
    runnerUp: 'Barcelona de 2007',
    description: 'A sexta edição trouxe novos nomes e reforçou o espírito competitivo do evento.',
    highlights: ['Novos talentos', 'Final emocionante', 'Resumo em construção']
  },
  {
    slug: 'copa-ace-7',
    title: 'Copa Ace 7',
    logo: '/hall-of-fame/logos/copa-ace-6-7.png',
    date: '18 de fevereiro de 2025',
    champion: 'Chape e-Sports',
    runnerUp: 'Mystic',
    description: 'Dezesseis equipes disputaram quatro grupos em dupla eliminação antes dos playoffs em eliminação simples.',
    highlights: ['16 equipes', 'Grupos: dupla eliminação · MD1', 'Playoffs: eliminação simples · MD3']
  },
  {
    slug: 'copa-ace-8',
    title: 'Copa Ace 8',
    logo: '/hall-of-fame/logos/copa-ace-8.png',
    date: '26 de maio de 2025',
    champion: 'Chape e-Sports',
    runnerUp: "Don't Crash",
    description: "Dezesseis equipes disputaram quatro grupos. A Chape e-Sports venceu a Don't Crash por 2–1 na grande final.",
    highlights: ['16 equipes', 'Grupos: todos contra todos · MD1', 'Playoffs: eliminação simples · MD3']
  },
  {
    slug: 'ace-clutch',
    title: 'Ace Clutch 1',
    logo: '/hall-of-fame/logos/ace-clutch.png',
    date: '6 de setembro de 2025',
    champion: 'New Icons',
    runnerUp: 'AMIGOS DO SDR',
    description: 'Treze equipes disputaram a primeira Ace Clutch em eliminação simples. A New Icons venceu a AMIGOS DO SDR por 2–0 na grande final.',
    highlights: ['13 equipes', 'Eliminação simples', 'Grande final MD3: New Icons 2–0 AMIGOS DO SDR']
  },
  {
    slug: 'ace-clutch-2',
    title: 'Ace Clutch 2',
    logo: '/hall-of-fame/logos/ace-clutch.png',
    date: '27 de setembro de 2025',
    champion: 'NOX CLAN',
    runnerUp: 'Last AuAu',
    description: 'Oito equipes disputaram uma chave de dupla eliminação. A NOX CLAN venceu a Last AuAu por 2–0 na grande final.',
    highlights: ['8 equipes', 'Dupla eliminação', 'Grande final MD3: NOX CLAN 2–0 Last AuAu']
  },
  {
    slug: 'copa-ace-9',
    title: 'Copa Ace 9',
    logo: '/hall-of-fame/logos/copa-ace-9.png',
    date: '7 de novembro de 2025',
    champion: 'GodNation',
    runnerUp: 'Lamba Esports',
    description: 'A nona edição fecha o ciclo com um novo capítulo da Copa Ace e sua grande tradição.',
    highlights: ['Última edição listada', 'Nova geração', 'Resumo em construção']
  },
  {
    slug: 'copa-ace-10',
    title: 'Copa Ace 10',
    logo: '/hall-of-fame/logos/copa-ace-10.png',
    date: '20 de agosto',
    champion: 'Em disputa',
    runnerUp: 'A definir',
    description: 'A décima edição reúne 16 equipes em uma fase suíça MD1, seguida por playoffs MD3.',
    highlights: ['16 equipes', 'Sistema suíço em MD1', 'Mata-mata em MD3'],
    status: 'ongoing',
    href: '/copa-ace-10'
  }
]
