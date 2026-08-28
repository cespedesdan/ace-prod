import Image from 'next/image'
import type { FaceitChampionshipSnapshot } from '@/lib/faceit'
import { buildFaceitSwissStandings } from '@/lib/faceit'

export function RankingTable({
  teams,
  matches,
  syncedAt,
}: {
  teams: FaceitChampionshipSnapshot['teams']
  matches: FaceitChampionshipSnapshot['matches']
  syncedAt: Date | null
}) {
  const standings = buildFaceitSwissStandings(teams, matches)
  const logos = new Map(teams.map((team) => [team.teamId, team.avatarUrl]))
  for (const match of matches) {
    for (const team of match.teams) if (team.avatarUrl) logos.set(team.teamId, team.avatarUrl)
  }

  return (
    <div className="brand-card overflow-hidden">
      <div className="flex flex-col justify-between gap-2 border-b border-copa-cyan/15 bg-copa-cyan/5 px-6 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-copa-cyan">Copa Ace 10</p>
          <h3 className="mt-1 text-lg font-black uppercase text-white">Classificação da fase de grupos · Sistema suíço</h3>
        </div>
        <div className="text-left text-xs font-bold uppercase tracking-wider text-gray-500 sm:text-right">
          <p>{standings.length || 16} equipes</p>
          {syncedAt && <p className="mt-1 text-[10px]">Atualizado em {syncedAt.toLocaleString('pt-BR')}</p>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-smoke/70">
            <tr className="text-left text-xs font-black uppercase tracking-wider text-copa-cyan">
              <th className="px-6 py-4">Posição</th>
              <th className="px-6 py-4">Equipe</th>
              <th className="px-6 py-4">Campanha</th>
              <th className="px-6 py-4">Vitórias</th>
              <th className="px-6 py-4">Derrotas</th>
              <th className="px-6 py-4">Saldo</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {standings.length ? standings.map((standing, index) => (
              <tr key={standing.teamId} className={`border-t border-white/5 text-sm text-gray-300 ${index < 8 ? 'bg-emerald-500/10' : 'bg-red-500/10'} ${index === 8 ? 'shadow-[inset_0_2px_0_rgba(248,113,113,.45)]' : ''}`}>
                <td className={`px-6 py-4 font-black ${index < 8 ? 'text-copa-cyan' : 'text-[#FF1476]'}`}>{index + 1}º</td>
                <td className="px-6 py-3 font-black text-white">
                  <div className="flex items-center gap-3">
                    <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden border border-white/10 bg-white/5 text-[10px] text-copa-cyan" aria-hidden="true">
                      {logos.get(standing.teamId)
                        ? <Image src={logos.get(standing.teamId)!} alt="" width={32} height={32} className="h-full w-full object-contain p-0.5" />
                        : standing.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span>{standing.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold">{standing.wins}–{standing.losses}</td>
                <td className="px-6 py-4">{standing.wins}</td>
                <td className="px-6 py-4">{standing.losses}</td>
                <td className="px-6 py-4">{standing.scoreBalance > 0 ? '+' : ''}{standing.scoreBalance}</td>
                <td className="px-6 py-4">
                  <span className={index < 8 ? 'font-black text-emerald-400' : 'font-black text-red-400'}>{index < 8 ? 'Classifica' : 'Não classifica'}</span>
                </td>
              </tr>
            )) : <tr>
              <td colSpan={7} className="px-6 py-16 text-center">
                <p className="text-sm font-bold text-gray-400">Aguardando a publicação dos times pela FACEIT.</p>
              </td>
            </tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
