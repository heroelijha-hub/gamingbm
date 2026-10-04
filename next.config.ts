import type { NextConfig } from "next";

const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  compress: true,
  serverExternalPackages: ['pdfkit', 'fontkit', '@swc/helpers'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  turbopack: {},

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 360, 420, 480, 500, 540, 600, 640, 700, 750, 828, 900, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/categorie-produit/:path*',
        destination: '/product-category/:path*',
        permanent: true,
      },
      {
        source: '/etiquette-produit/:path*',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/produit/:path*',
        destination: '/product/:path*',
        permanent: true,
      },
      {
        source: '/team/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/pricing-table',
        destination: '/',
        permanent: true,
      },
      {
        source: '/blogs',
        destination: '/blog',
        permanent: true,
      },

      {
        source: '/wp-content/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-json/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-includes/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: true,
      }
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://us.i.posthog.com https://us-assets.i.posthog.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://*.stripe.com https://www.google-analytics.com https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://api-m.paypal.com https://us.i.posthog.com https://us-assets.i.posthog.com https://www.google-analytics.com https://www.googletagmanager.com; frame-src 'self' https://js.stripe.com https://www.paypal.com;",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
