'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const selector = 'a[data-intent-prefetch][href]'

export function IntentPrefetch() {
  const router = useRouter()

  useEffect(() => {
    const prefetched = new WeakSet<HTMLAnchorElement>()
    const prefetchLink = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest(selector) : null
      if (!(target instanceof HTMLAnchorElement) || prefetched.has(target)) return

      const url = new URL(target.href, window.location.href)
      if (url.origin !== window.location.origin) return

      prefetched.add(target)
      router.prefetch(`${url.pathname}${url.search}`)
    }

    document.addEventListener('pointerover', prefetchLink, { passive: true })
    document.addEventListener('focusin', prefetchLink)
    document.addEventListener('touchstart', prefetchLink, { passive: true })

    return () => {
      document.removeEventListener('pointerover', prefetchLink)
      document.removeEventListener('focusin', prefetchLink)
      document.removeEventListener('touchstart', prefetchLink)
    }
  }, [router])

  return null
}
