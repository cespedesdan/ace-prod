'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const intentSelector = 'a[data-intent-prefetch][href]'
const deferredSelector = '.deferred-render, .deferred-render-compact'
const stylesheetLoads = new Map<string, Promise<void>>()

function loadStylesheet(href: string) {
  const pending = stylesheetLoads.get(href)
  if (pending) return pending

  const existing = document.querySelector<HTMLLinkElement>(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)
  if (existing?.sheet) return Promise.resolve()

  const link = existing ?? document.createElement('link')
  const load = new Promise<void>((resolve) => {
    link.addEventListener('load', () => resolve(), { once: true })
    link.addEventListener('error', () => resolve(), { once: true })
  })
  stylesheetLoads.set(href, load)

  if (!existing) {
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }

  return load
}

export function ClientPerformance() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const prefetched = new WeakSet<HTMLAnchorElement>()
    const prefetchLink = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest(intentSelector) : null
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

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(deferredSelector)
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => { section.dataset.renderVisible = 'true' })
      return
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const section = entry.target as HTMLElement
        observer.unobserve(section)
        const owner = section.closest<HTMLElement>('[data-deferred-stylesheet]')
        const stylesheet = owner?.dataset.deferredStylesheet
        const reveal = () => { section.dataset.renderVisible = 'true' }
        if (stylesheet) void loadStylesheet(stylesheet).then(reveal)
        else reveal()
      }
    }, { rootMargin: '400px 0px' })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [pathname])

  return null
}
