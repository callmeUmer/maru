/**
 * Expo reads app.json first and hands it here as `config`; this file only
 * overlays the values that differ per environment, so app.json stays the
 * single source of truth for everything static.
 *
 * Set ANILIST_CLIENT_ID locally in .env (see .env.example) and as an EAS
 * environment variable for cloud builds. Leaving it unset is not fatal — the
 * app falls back to guest-only browsing and says so on the sign-in screen.
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    anilistClientId: process.env.ANILIST_CLIENT_ID ?? config.extra?.anilistClientId ?? '',
  },
});
