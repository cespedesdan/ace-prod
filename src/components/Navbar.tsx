'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logotipo } from './Logotipo'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Copa Ace 10', href: '/copa-ace-10', edition: true },
  { name: 'Agenda', href: '/schedule' },
  { name: 'Notícias', href: '/news' },
  { name: 'Hall da Fama', href: '/hall-of-fame' },
  { name: 'Inscreva-se', href: '/inscreva-se', highlight: true },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-ace-cyan/20 bg-smoke/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Logotipo size="md" variant="neutral" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  item.edition
                    ? cn('copa10-nav-button', pathname === item.href && 'is-active')
                    : pathname === item.href
                    ? 'bg-copa-cyan/10 text-copa-cyan'
                    : item.highlight
                      ? 'bg-copa-cyan text-smoke hover:bg-cyan-300'
                    : 'text-gray-300 hover:bg-copa-cyan/5 hover:text-copa-cyan'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="text-gray-300 hover:text-copa-cyan focus:outline-none"
            >
              <span className="sr-only">Abrir menu principal</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-white/10 pb-4 pt-3 md:hidden">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
                  item.edition
                    ? cn('copa10-nav-button', pathname === item.href && 'is-active')
                    : pathname === item.href
                    ? 'bg-copa-cyan/10 text-copa-cyan'
                    : item.highlight
                      ? 'bg-copa-cyan text-smoke'
                      : 'text-gray-300 hover:bg-copa-cyan/5 hover:text-copa-cyan'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
