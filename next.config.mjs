import createBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com https://i.ytimg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.youtube.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  'report-uri /api/security/csp-report',
  'report-to csp-endpoint',
].join('; ')

const nextConfig = {
  distDir: process.env.ANALYZE === 'true' ? '.next-analyze' : '.next',
  poweredByHeader: false,
  experimental: {
    inlineCss: true,
    reactCompiler: true,
  },
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'distribution.faceit-cdn.net',
        pathname: '/images/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 'assets.faceit-cdn.net',
        pathname: '/**',
        search: '',
      },
    ],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Reporting-Endpoints', value: 'csp-endpoint="/api/security/csp-report"' },
        { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
      ],
    }]
  },
}

export default withBundleAnalyzer(nextConfig)
