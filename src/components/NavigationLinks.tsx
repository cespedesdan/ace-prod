'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navigation: Array<{ name: string; href: string; edition?: boolean; highlight?: boolean }> = [
  { name: 'Home', href: '/' },
  { name: 'Copa Ace 10', href: '/copa-ace-10', edition: true },
  { name: 'Agenda', href: '/schedule' },
  { name: 'Notícias', href: '/news' },
  { name: 'Hall da Fama', href: '/hall-of-fame' },
  //{ name: 'Inscreva-se', href: '/inscreva-se', highlight: true },
]

const intentSelector = 'a[data-intent-prefetch][href]'

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || (href === '/hall-of-fame' && pathname.startsWith('/hall-of-fame/'))
}

function navigationClass(item: (typeof navigation)[number], mobile = false) {
  const base = mobile
    ? 'block rounded-md px-3 py-2.5 text-sm font-semibold transition-colors'
    : 'px-3 py-2 rounded-md text-sm font-medium transition-colors'
  const variant = item.edition
    ? 'copa10-nav-button'
    : item.highlight
      ? mobile ? 'bg-copa-cyan text-smoke' : 'bg-copa-cyan text-smoke hover:bg-cyan-300'
      : 'text-gray-300 hover:bg-copa-cyan/5 hover:text-copa-cyan'
  const slug = item.href === '/' ? 'home' : item.href.slice(1)
  return `${base} nav-link nav-link-${slug} ${variant}`
}

export function NavigationLinks() {
  const pathname = usePathname()
  const router = useRouter()
  const mobileMenu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    mobileMenu.current?.removeAttribute('open')
    document.querySelectorAll<HTMLAnchorElement>(`${intentSelector}[data-navigation-pending]`).forEach((link) => {
      link.removeAttribute('aria-busy')
      link.removeAttribute('data-navigation-pending')
    })

    const prefetched = new WeakSet<HTMLAnchorElement>()
    const prefetchLink = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest(intentSelector) : null
      if (!(target instanceof HTMLAnchorElement) || prefetched.has(target)) return

      const url = new URL(target.href, window.location.href)
      if (url.origin !== window.location.origin) return

      prefetched.add(target)
      router.prefetch(`${url.pathname}${url.search}`)
    }

    const markNavigationPending = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target.closest(intentSelector) : null
      if (!(target instanceof HTMLAnchorElement) || target.target === '_blank' || target.hasAttribute('download')) return

      const url = new URL(target.href, window.location.href)
      if (url.origin !== window.location.origin || `${url.pathname}${url.search}` === `${window.location.pathname}${window.location.search}`) return

      target.setAttribute('aria-busy', 'true')
      target.setAttribute('data-navigation-pending', '')
    }

    document.addEventListener('pointerover', prefetchLink, { passive: true })
    document.addEventListener('focusin', prefetchLink)
    document.addEventListener('touchstart', prefetchLink, { passive: true })
    // Capture before Next.js prevents the link's native click during client
    // navigation, otherwise the delegated handler would see defaultPrevented.
    document.addEventListener('click', markNavigationPending, true)

    return () => {
      document.removeEventListener('pointerover', prefetchLink)
      document.removeEventListener('focusin', prefetchLink)
      document.removeEventListener('touchstart', prefetchLink)
      document.removeEventListener('click', markNavigationPending, true)
    }
  }, [pathname, router])

  return (
    <>
      <div className="desktop-navigation items-center space-x-5">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            prefetch={false}
            data-intent-prefetch=""
            aria-current={isCurrentRoute(pathname, item.href) ? 'page' : undefined}
            className={navigationClass(item)}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <details ref={mobileMenu} className="mobile-navigation">
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
              data-intent-prefetch=""
              aria-current={isCurrentRoute(pathname, item.href) ? 'page' : undefined}
              onClick={() => mobileMenu.current?.removeAttribute('open')}
              className={navigationClass(item, true)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </details>
    </>
  )
}
