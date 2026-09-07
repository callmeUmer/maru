# MARU — Privacy Policy

**Effective 7 September 2026**

MARU is an independent, open-source client for [AniList](https://anilist.co). It has no
servers of its own. This policy explains what the app does with your data, which is very
little.

## What MARU collects

**Nothing.** MARU has no backend, no analytics, no crash reporting, no advertising, and no
tracking SDKs. The developer receives no data about you or your use of the app.

## What is stored on your device

| Data | Where | Why |
|---|---|---|
| Your AniList access token | Android Keystore, via `expo-secure-store` | Keeps you signed in |
| App preferences (theme, scoring format, list order, toggles) | App-private storage | Remembers your settings |
| Cached covers and API responses | App-private cache | Makes the app fast and reduces network use |

All of it stays in MARU's private app sandbox. It is excluded from Android cloud backup, so
your token is never copied off the device. Uninstalling the app deletes all of it.

## What is sent to AniList

If you sign in, MARU talks to the public AniList GraphQL API (`graphql.anilist.co`) on your
behalf, over HTTPS. It sends your access token so AniList knows who you are, plus the
changes you make — episode progress, scores, list status. It reads your profile, lists,
notifications and activity so it can show them to you.

MARU never sees your AniList password. Sign-in happens on anilist.co in a system browser tab;
AniList hands the app a token afterwards.

Your use of AniList is governed by
[AniList's privacy policy](https://anilist.co/terms) and terms, not this one.

If you **Browse as guest**, no token exists and no personal data is sent — MARU only makes
anonymous public queries for trending and seasonal titles.

## Children

MARU is not directed at children under 13. AniList catalogues titles for a general audience,
including mature ones; adult content is off by default and can be enabled in Settings by
users whose AniList account permits it.

## Deleting your data

- **Sign out** (Settings → Session → Sign out) erases the stored token and cached account
  data from the device immediately.
- **Uninstalling** MARU removes everything it has stored.
- **Revoking access**: visit <https://anilist.co/settings/apps> to revoke MARU's token from
  the AniList side.
- Deleting your AniList *account* is done at AniList, not here — MARU holds no account of
  its own to delete.

## Changes

Material changes to this policy will ship with a new app version and be noted in the
release notes.

## Contact

Questions or requests: open an issue on the project's repository, or email the address
listed on the app's Play Store listing.
