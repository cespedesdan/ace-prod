const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

export function parseYouTubeVideoId(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    let videoId: string | null = null

    if (hostname === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] || null
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const segments = url.pathname.split('/').filter(Boolean)
      videoId = segments[0] === 'watch' ? url.searchParams.get('v') : segments[1] || null
    }

    return url.protocol === 'https:' && videoId && VIDEO_ID_PATTERN.test(videoId) ? videoId : null
  } catch {
    return null
  }
}
