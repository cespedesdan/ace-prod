'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'

type PlayerComponent = ComponentType<{ videoId: string }>

export function YouTubeLivePlayer({ videoId }: { videoId: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [Player, setPlayer] = useState<PlayerComponent | null>(null)

  useEffect(() => {
    let cancelled = false
    let observer: IntersectionObserver | null = null
    const loadPlayer = () => {
      observer?.disconnect()
      void import('./YouTubePlayerFrame').then(({ YouTubePlayerFrame }) => {
        if (!cancelled) setPlayer(() => YouTubePlayerFrame)
      })
    }

    if (container.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) loadPlayer()
      })
      observer.observe(container.current)
    } else {
      loadPlayer()
    }

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [])

  return (
    <div ref={container} className="relative aspect-video w-full overflow-hidden bg-black">
      {Player && <Player videoId={videoId} />}
    </div>
  )
}
