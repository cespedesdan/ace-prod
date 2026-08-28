'use client'

import { useEffect, useRef } from 'react'

type Player = {
  mute(): void
  playVideo(): void
  destroy(): void
}

type YouTubeWindow = Window & {
  YT?: {
    Player: new (element: HTMLElement, options: {
      width: string
      height: string
      videoId: string
      playerVars: Record<string, string | number>
      events: { onReady(event: { target: Player }): void }
    }) => Player
  }
  onYouTubeIframeAPIReady?: () => void
}

export function YouTubeLivePlayer({ videoId }: { videoId: string }) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const youtubeWindow = window as YouTubeWindow
    let player: Player | null = null
    let cancelled = false
    let observer: IntersectionObserver | null = null

    const createPlayer = () => {
      if (cancelled || !container.current || !youtubeWindow.YT) return
      player = new youtubeWindow.YT.Player(container.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: ({ target }) => {
            target.mute()
            target.playVideo()
          },
        },
      })
    }

    const previousReady = youtubeWindow.onYouTubeIframeAPIReady
    const ready = () => {
      previousReady?.()
      createPlayer()
    }

    const loadPlayer = () => {
      if (youtubeWindow.YT?.Player) createPlayer()
      else {
        youtubeWindow.onYouTubeIframeAPIReady = ready
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          const script = document.createElement('script')
          script.src = 'https://www.youtube.com/iframe_api'
          script.async = true
          document.head.appendChild(script)
        }
      }
    }

    if (container.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return
        observer?.disconnect()
        loadPlayer()
      }, { rootMargin: '200px' })
      observer.observe(container.current)
    } else {
      loadPlayer()
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      player?.destroy()
      if (youtubeWindow.onYouTubeIframeAPIReady === ready) youtubeWindow.onYouTubeIframeAPIReady = previousReady
    }
  }, [videoId])

  return <div className="relative aspect-video w-full overflow-hidden bg-black"><div ref={container} className="absolute inset-0 h-full w-full" /></div>
}
