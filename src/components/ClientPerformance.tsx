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
    if (document.documentElement.classList.contains('until-found')) {
      sections.forEach((section) => section.setAttribute('hidden', 'until-found'))
    } else {
      sections.forEach((section) => section.removeAttribute('hidden'))
    }
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => {
        section.removeAttribute('hidden')
        section.dataset.renderVisible = 'true'
      })
      return
    }

    let observer: IntersectionObserver | null = null
    const revealSection = (section: HTMLElement) => {
      observer?.unobserve(section)
      const owner = section.closest<HTMLElement>('[data-deferred-stylesheet]')
      const stylesheet = owner?.dataset.deferredStylesheet
      const reveal = () => {
        section.removeAttribute('hidden')
        section.dataset.renderVisible = 'true'
      }
      if (!stylesheet) {
        reveal()
        return Promise.resolve()
      }
      return loadStylesheet(stylesheet).then(reveal)
    }

    const revealForFragment = (target: HTMLElement, behavior: ScrollBehavior) => {
      void Promise.all([...sections].map(revealSection)).then(() => {
        // Let the browser calculate the final section heights before scrolling.
        // The deferred stylesheet must be loaded first so the wide Swiss bracket
        // is contained while mobile Chrome performs this layout.
        sections.forEach((section) => { section.style.contentVisibility = 'visible' })
        void document.documentElement.offsetHeight
        requestAnimationFrame(() => target.scrollIntoView({ behavior, block: 'start' }))
      })
    }

    const navigateToFragment = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href*="#"]') : null
      if (!link) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!target) return

      event.preventDefault()
      window.history.pushState(window.history.state, '', url.hash)
      revealForFragment(target, 'smooth')
    }

    document.addEventListener('click', navigateToFragment)
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const section = entry.target as HTMLElement
        void revealSection(section)
      }
    }, { rootMargin: '100px 0px' })

    sections.forEach((section) => observer.observe(section))
    const initialTarget = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    if (initialTarget) revealForFragment(initialTarget, 'auto')
    return () => {
      document.removeEventListener('click', navigateToFragment)
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
