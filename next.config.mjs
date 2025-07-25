/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'puppeteer', 'mammoth']
  },
  // Configure webpack to handle pdf-parse properly
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle pdf-parse external dependencies
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        'mammoth': 'commonjs mammoth',
        'canvas': 'canvas'
      })
    }
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      }
    }
    
    // Ignore test files and unnecessary files
    config.module.rules.push({
      test: /\.pdf$/,
      type: 'asset/resource',
    })
    
    return config
  },
  // Configure headers for file uploads
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  // Enable SWC minification for better performance
  swcMinify: true,
  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable gzip compression
  compress: true,
  // Configure poweredByHeader
  poweredByHeader: false,
  // Configure redirects if needed
  async redirects() {
    return []
  },
};

export default nextConfig;