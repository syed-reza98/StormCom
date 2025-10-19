// sentry.config.js
module.exports = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: 'stormcom-org',
  project: 'stormcom',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  setCommits: {
    auto: true,
  },
  sourcemaps: {
    include: ['./src'],
    ignore: ['node_modules'],
  },
};
