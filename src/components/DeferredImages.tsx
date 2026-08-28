'use client'

import { useEffect } from 'react'

function activate(image: HTMLImageElement) {
  const src = image.dataset.deferredSrc
  if (!src) return
  image.src = src
  delete image.dataset.deferredSrc
}

export function DeferredImages() {
  useEffect(() => {
    const images = document.querySelectorAll<HTMLImageElement>('img[data-deferred-src]')
    if (!('IntersectionObserver' in window)) {
      images.forEach(activate)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const image = entry.target as HTMLImageElement
        observer.unobserve(image)
        activate(image)
      }
    }, { rootMargin: '100px 0px' })

    images.forEach((image) => observer.observe(image))
    return () => observer.disconnect()
  }, [])

  return null
}
