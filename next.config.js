/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // No `env` block: Next inlines those values into every bundle that references them, including
  // browser code. Server code reads process.env at runtime; browser values must be NEXT_PUBLIC_*.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mars-images.imgix.net',
        port: '',
        pathname: '/seobot/devhunt.org/**',
      },
      {
        protocol: 'https',
        hostname: 'ph-files.imgix.net',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'assets.seobotai.com',
        pathname: '/**',
      },
    ],
  },
};
module.exports = nextConfig;
