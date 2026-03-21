/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Prisma on Hostinger / Node.js hosting
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [],
  },

  // Ensure environment variables are available
  env: {
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'Kahaan Kya Hua',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kahaankyahua.com',
  },
}

module.exports = nextConfig
