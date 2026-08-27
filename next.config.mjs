import createBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  distDir: process.env.ANALYZE === 'true' ? '.next-analyze' : '.next',
  poweredByHeader: false,
  experimental: {
    reactCompiler: true,
  },
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'distribution.faceit-cdn.net',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.faceit-cdn.net',
        pathname: '/**',
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
      ],
    }]
  },
}

export default withBundleAnalyzer(nextConfig)
