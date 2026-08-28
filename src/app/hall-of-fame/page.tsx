import { HallOfFameList } from '@/components/HallOfFameList'
import './hall-of-fame.css'

export default function HallOfFamePage() {
  return (
    <div className="hall-of-fame-page min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 border-l-4 border-copa-cyan pl-5">
          <p className="brand-kicker mb-2">Arquivo competitivo</p>
          <h1 className="text-3xl font-bold uppercase text-white">Hall da Fama</h1>
          <p className="mt-2 text-gray-400">Acompanhe a história da Copa Ace, seus campeões e a edição atual</p>
        </div>

        <HallOfFameList />
      </div>
    </div>
  )
}
