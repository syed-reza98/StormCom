/**
 * Sentry configuration for source map upload
 * This file is used by @sentry/nextjs to configure Sentry
 */

module.exports = {
  // Automatically upload source maps during build
  automaticVercelMonitors: true,
  
  // Organization and project settings
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Auth token for uploading
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Silent mode (no console output during build)
  silent: true,
  
  // Hide source maps from public
  hideSourceMaps: true,
  
  // Disable Sentry SDK during build
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
  
  // Webpack plugin options
  widenClientFileUpload: true,
  transpileClientSDK: true,
};
