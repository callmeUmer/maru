import { Redirect } from 'expo-router';

/**
 * AniList sends the user back to `maru://auth#access_token=...` after approval,
 * and Android delivers that to the app as a deep link. The token is read by
 * `WebBrowser.openAuthSessionAsync` over in `src/state/auth.tsx`; this route
 * exists only so the navigation has somewhere to land — without it expo-router
 * renders its "Unmatched Route" screen on top of the sign-in flow.
 *
 * Handing straight back to the root gate keeps the decision in one place: it
 * sends the user home once the token is stored, or to onboarding if it never
 * arrived.
 */
export default function AuthRedirect() {
  return <Redirect href="/" />;
}
