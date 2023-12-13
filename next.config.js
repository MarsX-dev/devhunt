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
  env: {
    DISCOR_TOOL_WEBHOOK: process.env.DISCOR_TOOL_WEBHOOK,
    DISCORD_USER_WEBHOOK: process.env.DISCORD_USER_WEBHOOK,
    USER_MAVEN_KEY: process.env.USER_MAVEN_KEY,
    WELCOME_EMAIL_API_KEY: process.env.WELCOME_EMAIL_API_KEY,
    SIGNUP_FORM_ID: process.env.SIGNUP_FORM_ID,
    NEWSLETTER_FORM_ID: process.env.NEWSLETTER_FORM_ID,
    AUTH_TOKEN_PASSWORD: process.env.AUTH_TOKEN_PASSWORD,
    AUTH_TOKEN_API_KEY: process.env.AUTH_TOKEN_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mars-images.imgix.net',
        port: '',
        pathname: '/seobot/devhunt.org/**',
      },
    ],
  },
};
module.exports = nextConfig;
