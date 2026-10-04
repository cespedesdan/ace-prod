import { IntentLink } from './IntentLink'
import { Logotipo } from './Logotipo'
import { NavigationLinks } from './NavigationLinks'
import { getFeaturedTournament } from '@/lib/registration-status'
import { tournamentPublicPath } from '@/lib/tournaments'

export async function Navbar() {
  const tournament = await getFeaturedTournament()

  return (
    <nav aria-label="Navegação principal" className="sticky top-0 z-50 border-b border-ace-cyan/20 bg-smoke md:bg-smoke/95 md:backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <IntentLink href="/" className="flex items-center space-x-3">
            <Logotipo size="md" variant="neutral" />
          </IntentLink>

          <NavigationLinks
            featuredTournament={tournament ? {
              name: tournament.name,
              href: tournamentPublicPath(tournament.slug),
              edition: tournament.slug === 'copa-ace-10',
              clutch: tournament.slug.startsWith('ace-clutch'),
              registrationOpen: tournament.registrationOpen && tournament.status !== 'COMPLETED',
            } : null}
          />
        </div>
      </div>
    </nav>
  )
}
