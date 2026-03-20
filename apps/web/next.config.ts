import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@treatment-builder/shared'],
  async headers() {
    return [
      {
        source: '/widget.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
