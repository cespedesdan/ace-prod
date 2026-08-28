export function YouTubeLivePlayer({ videoId }: { videoId: string }) {
  const source = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`
  const thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
  const facade = `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width"><style>*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:#050505 center/cover no-repeat url('${thumbnail}');font-family:Arial,sans-serif}a{display:grid;height:100%;place-items:center;color:#fff;text-decoration:none;background:linear-gradient(#0002,#0008)}span{display:grid;width:72px;height:52px;place-items:center;border-radius:14px;background:#f00;box-shadow:0 12px 32px #0008;font-size:27px;padding-left:4px}b{position:absolute;bottom:18px;letter-spacing:.08em;text-transform:uppercase;font-size:12px;text-shadow:0 2px 8px #000}</style></head><body><a href="${source}" aria-label="Reproduzir transmissão"><span aria-hidden="true">&#9654;</span><b>Reproduzir transmissão</b></a></body></html>`

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={source}
        srcDoc={facade}
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
