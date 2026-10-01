/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next dev` builds into its own folder (NEXT_DIST_DIR=.next-dev, see .claude/launch.json) so it can
  // run next to `next start` without overwriting the production build in .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
  // The analytics page moved out of /account (it's DevHunt's analytics, admins only).
  async redirects() {
    return [
      { source: '/account/analytics', destination: '/admin/analytics', permanent: true },
      { source: '/about', destination: '/the-story', permanent: true },
      // A maker listing of v0 whose link expired (hidden as hijacked); its search traffic goes to the v0 reference listing.
      { source: '/tool/v0app-by-vercel', destination: '/tool/v0', permanent: true },
      // Blog near-duplicates merged into the post that won their topic (utils/blogPrune.ts, seo-plan.md A6).
      // Here rather than in the page: the page streams behind loading.tsx, where a redirect is not a real 308.
      ...Object.entries(require('./utils/blogPrune.json').redirects).map(([from, to]) => ({
        source: `/blog/${from}`,
        destination: `/blog/${to}`,
        permanent: true,
      })),
    ];
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
