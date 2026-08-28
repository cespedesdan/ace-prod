'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const deferredSelector = '.deferred-render, .deferred-render-compact'
const stylesheetLoads = new Map<string, Promise<void>>()

function activateDeferredImages(container: ParentNode) {
  container.querySelectorAll<HTMLSourceElement>('source[data-deferred-srcset]').forEach((source) => {
    const srcset = source.dataset.deferredSrcset
    if (!srcset) return
    source.srcset = srcset
    delete source.dataset.deferredSrcset
  })
  container.querySelectorAll<HTMLImageElement>('img[data-deferred-src]').forEach((image) => {
    const src = image.dataset.deferredSrc
    if (!src) return
    image.src = src
    delete image.dataset.deferredSrc
  })
}

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

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(deferredSelector)
    const standaloneImages = document.querySelectorAll<HTMLImageElement>('img[data-deferred-standalone]')
    if (!('IntersectionObserver' in window)) {
      let cancelled = false
      const stylesheets = new Set<string>()
      sections.forEach((section) => {
        const stylesheet = section.closest<HTMLElement>('[data-deferred-stylesheet]')?.dataset.deferredStylesheet
        if (stylesheet) stylesheets.add(stylesheet)
      })
      void Promise.all([...stylesheets].map(loadStylesheet)).then(() => {
        if (cancelled) return
        sections.forEach((section) => {
          activateDeferredImages(section)
          section.dataset.renderVisible = 'true'
        })
        standaloneImages.forEach((image) => activateDeferredImages(image.parentElement ?? document))
      })
      return () => { cancelled = true }
    }

    let observer: IntersectionObserver | null = null
    let imageObserver: IntersectionObserver | null = null
    const revealSection = (section: HTMLElement) => {
      observer?.unobserve(section)
      const owner = section.closest<HTMLElement>('[data-deferred-stylesheet]')
      const stylesheet = owner?.dataset.deferredStylesheet
      const reveal = () => {
        activateDeferredImages(section)
        section.dataset.renderVisible = 'true'
      }
      if (!stylesheet) {
        reveal()
        return Promise.resolve()
      }
      return loadStylesheet(stylesheet).then(reveal)
    }

    const revealForFragment = (target: HTMLElement, behavior: ScrollBehavior | 'instant') => {
      void Promise.all([...sections].map(revealSection)).then(() => {
        // Let the browser calculate the final section heights before scrolling.
        // The deferred stylesheet must be loaded first so the wide Swiss bracket
        // is contained while mobile Chrome performs this layout.
        sections.forEach((section) => { section.style.contentVisibility = 'visible' })
        void document.documentElement.offsetHeight
        requestAnimationFrame(() => target.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'start' }))
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
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      revealForFragment(target, behavior)
    }

    const revealBeforeMatch = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(deferredSelector) : null
      if (target) revealForFragment(target, 'instant')
    }

    let matchScrollTimer: number | undefined
    const revealSelectedMatch = () => {
      const node = document.getSelection()?.anchorNode
      const element = node instanceof Element ? node : node?.parentElement
      const target = element?.closest<HTMLElement>(deferredSelector)
      if (!target || target.dataset.renderVisible === 'true') return

      revealForFragment(target, 'instant')
      window.clearTimeout(matchScrollTimer)
      matchScrollTimer = window.setTimeout(() => {
        if (element?.isConnected) element.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' })
      }, 250)
    }

    document.addEventListener('click', navigateToFragment)
    document.addEventListener('beforematch', revealBeforeMatch)
    document.addEventListener('selectionchange', revealSelectedMatch)
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const section = entry.target as HTMLElement
        void revealSection(section)
      }
    }, { rootMargin: '100px 0px' })

    sections.forEach((section) => observer.observe(section))
    imageObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const image = entry.target as HTMLImageElement
        imageObserver?.unobserve(image)
        activateDeferredImages(image.parentElement ?? document)
      }
    })
    standaloneImages.forEach((image) => imageObserver?.observe(image))
    let initialTarget: HTMLElement | null = null
    try {
      initialTarget = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    } catch {
      // Ignore malformed fragments instead of breaking the shared client shell.
    }
    if (initialTarget) revealForFragment(initialTarget, 'instant')
    return () => {
      document.removeEventListener('click', navigateToFragment)
      document.removeEventListener('beforematch', revealBeforeMatch)
      document.removeEventListener('selectionchange', revealSelectedMatch)
      window.clearTimeout(matchScrollTimer)
      observer?.disconnect()
      imageObserver?.disconnect()
    }
  }, [pathname])

  return null
}
