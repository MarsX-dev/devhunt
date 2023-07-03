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
    WELCOME_EMAIL_WEBHOOK: process.env.WELCOME_EMAIL_WEBHOOK,
    SIGNUP_FORM_ID: process.env.SIGNUP_FORM_ID,
  },
};
module.exports = nextConfig;
