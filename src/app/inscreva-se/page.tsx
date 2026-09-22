import type { Metadata } from 'next'
import RegistrationClosed from '@/components/RegistrationClosed'
import RegistrationForm from '@/components/RegistrationForm'
import { getOpenRegistrationTournament } from '@/lib/registration-status'

export async function generateMetadata(): Promise<Metadata> {
  const tournament = await getOpenRegistrationTournament()
  return tournament ? {
    title: `Inscreva-se — ${tournament.name} | Ace Produtora`,
    description: `Inscrição oficial de equipes para ${tournament.name}.`,
  } : {
    title: 'Inscrições encerradas | Ace Produtora',
    description: 'No momento não há campeonatos com inscrições abertas.',
  }
}

export default async function RegistrationPage() {
  const tournament = await getOpenRegistrationTournament()
  if (!tournament) return <RegistrationClosed />
  return <RegistrationForm tournament={{
    name: tournament.name,
    logoUrl: tournament.logoUrl,
    teamLimit: tournament.teamLimit,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate.toISOString(),
  }} />
}
