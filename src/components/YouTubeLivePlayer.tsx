export function YouTubeLivePlayer({ videoId }: { videoId: string }) {
  const source = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={source}
        title="Transmissão ao vivo da Copa ACE"
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  )
}
