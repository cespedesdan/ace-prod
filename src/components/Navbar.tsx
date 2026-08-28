import { IntentLink } from './IntentLink'
import { Logotipo } from './Logotipo'
import { NavigationLinks } from './NavigationLinks'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ace-cyan/20 bg-smoke md:bg-smoke/95 md:backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <IntentLink href="/" className="flex items-center space-x-3">
            <Logotipo size="md" variant="neutral" />
          </IntentLink>

          <NavigationLinks />
        </div>
      </div>
    </nav>
  )
}
