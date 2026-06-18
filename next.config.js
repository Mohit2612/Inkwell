const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Required for Sentry instrumentation hook in Next.js 14.
    instrumentationHook: true,
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Suppress noisy build output.
  silent: true,
  // Set org/project if you use Sentry source-map uploads.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps in production only.
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Avoid tree-shaking Sentry in the client bundle.
  automaticVercelMonitors: false,
});
