import { Clock3 } from 'lucide-react'

export function RankingTable() {
  return (
    <div className="brand-card overflow-hidden">
      <div className="flex flex-col justify-between gap-2 border-b border-copa-cyan/15 bg-copa-cyan/5 px-6 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-copa-cyan">Copa Ace 10</p>
          <h3 className="mt-1 text-lg font-black uppercase text-white">Classificação da fase de grupos Sisema Suiço</h3>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">16 equipes</span>
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
            <tr>
              <td colSpan={7} className="px-6 py-16 text-center">
                <Clock3 className="mx-auto text-copa-cyan" size={32} />
                <p className="mt-4 text-3xl font-black uppercase tracking-[0.12em] text-white">ASAP</p>
                <p className="mx-auto mt-2 max-w-lg text-sm text-gray-400">
                  A classificação será publicada assim que começarem os jogos da Copa ACE 10.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
