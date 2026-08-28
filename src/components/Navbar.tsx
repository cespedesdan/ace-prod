import Link from 'next/link'
import { Logotipo } from './Logotipo'

const navigation: Array<{ name: string; href: string; edition?: boolean; highlight?: boolean }> = [
  { name: 'Home', href: '/' },
  { name: 'Copa Ace 10', href: '/copa-ace-10', edition: true },
  { name: 'Agenda', href: '/schedule' },
  { name: 'Notícias', href: '/news' },
  { name: 'Hall da Fama', href: '/hall-of-fame' },
  //{ name: 'Inscreva-se', href: '/inscreva-se', highlight: true },
]

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ace-cyan/20 bg-smoke md:bg-smoke/95 md:backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" prefetch={false} className="flex items-center space-x-3">
            <Logotipo size="md" variant="neutral" />
          </Link>

          {/* Navigation Links */}
          <div className="desktop-navigation items-center space-x-5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className={`nav-link nav-link-${item.href === '/' ? 'home' : item.href.slice(1)} px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.edition
                    ? 'copa10-nav-button'
                    : item.highlight
                      ? 'bg-copa-cyan text-smoke hover:bg-cyan-300'
                      : 'text-gray-300 hover:bg-copa-cyan/5 hover:text-copa-cyan'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <details className="mobile-navigation">
            <summary className="cursor-pointer list-none text-gray-300 hover:text-copa-cyan focus:outline-none">
              <span className="sr-only">Abrir menu principal</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute inset-x-0 top-20 space-y-1 border-y border-white/10 bg-smoke px-4 pb-4 pt-3 shadow-2xl">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  className={`nav-link nav-link-${item.href === '/' ? 'home' : item.href.slice(1)} block rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                    item.edition
                      ? 'copa10-nav-button'
                      : item.highlight
                        ? 'bg-copa-cyan text-smoke'
                        : 'text-gray-300 hover:bg-copa-cyan/5 hover:text-copa-cyan'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </nav>
  )
}
