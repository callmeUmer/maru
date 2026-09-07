import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { gqlRequest, setTokenGetter, setUnauthorizedHandler } from '../api/client';
import { VIEWER } from '../api/queries';
import { Viewer } from '../api/types';

const TOKEN_KEY = 'maru.anilist.token';
const EXPIRY_KEY = 'maru.anilist.expiry';
const GUEST_KEY = 'maru.guest';

/** Refresh-free implicit tokens last a year; stop trusting one a day before it lapses. */
const EXPIRY_SKEW_MS = 24 * 60 * 60 * 1000;

/**
 * AniList issues implicit-grant tokens to a registered client. Set the id in
 * app.json under `expo.extra.anilistClientId` (or ANILIST_CLIENT_ID in the
 * environment, which app.config.js folds into the same field) with
 * `maru://auth` registered as the client's redirect URL.
 */
const CLIENT_ID =
  (Constants.expoConfig?.extra?.anilistClientId as string | undefined) ??
  process.env.EXPO_PUBLIC_ANILIST_CLIENT_ID ??
  '';

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://anilist.co/api/v2/oauth/authorize',
  tokenEndpoint: 'https://anilist.co/api/v2/oauth/token',
};

type AuthState = {
  ready: boolean;
  token: string | null;
  viewer: Viewer | null;
  /** Browsing without a token: tracking affordances stay hidden. */
  guest: boolean;
  signedIn: boolean;
  configured: boolean;
  signIn: () => Promise<{ ok: boolean; error?: string }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  refreshViewer: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// The client reads the token synchronously on every request; keep a module-level mirror.
let currentToken: string | null = null;
setTokenGetter(() => currentToken);

/** SecureStore is native-only; on web the session lives for the lifetime of the tab. */
const persists = Platform.OS !== 'web';

async function readItem(key: string) {
  if (!persists) return null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // A corrupt or unreadable keychain entry should read as "no session", not crash the launch.
    return null;
  }
}

async function writeItem(key: string, value: string | null) {
  if (!persists) return;
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Losing persistence is survivable — the in-memory session still works this launch.
  }
}

async function storeToken(token: string | null, expiresAt: number | null = null) {
  currentToken = token;
  await writeItem(TOKEN_KEY, token);
  await writeItem(EXPIRY_KEY, token && expiresAt ? String(expiresAt) : null);
}

/**
 * `promptAsync` resolves to a discriminated union; only the success and error
 * arms carry the redirect's parameters and parsed authentication.
 */
function resultToken(result: AuthSession.AuthSessionResult): {
  params: Record<string, string>;
  accessToken: string | null;
} {
  if (!('params' in result)) return { params: {}, accessToken: null };
  const params = result.params ?? {};
  return { params, accessToken: params.access_token ?? result.authentication?.accessToken ?? null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [guest, setGuest] = useState(false);

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'maru', path: 'auth' }),
    []
  );

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      scopes: [],
      usePKCE: false,
    },
    DISCOVERY
  );

  const loadViewer = useCallback(async () => {
    try {
      const data = await gqlRequest<{ Viewer: Viewer }>(VIEWER);
      setViewer(data.Viewer);
    } catch {
      // A rejected token is the only case worth acting on; leave transient errors alone.
      setViewer(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [stored, expiry, wasGuest] = await Promise.all([
          readItem(TOKEN_KEY),
          readItem(EXPIRY_KEY),
          readItem(GUEST_KEY),
        ]);
        const expiresAt = expiry ? Number(expiry) : null;
        const lapsed = !!expiresAt && Date.now() > expiresAt - EXPIRY_SKEW_MS;

        if (stored && !lapsed) {
          currentToken = stored;
          setToken(stored);
          await loadViewer();
        } else if (stored) {
          // Expired tokens only ever produce 401s — clear it and land on sign-in.
          await storeToken(null);
        }
        if (wasGuest === 'true') setGuest(true);
      } finally {
        setReady(true);
      }
    })();
  }, [loadViewer]);

  const signIn = useCallback(async () => {
    if (!CLIENT_ID) {
      return {
        ok: false,
        error:
          'No AniList client id configured. Add expo.extra.anilistClientId to app.json to enable sign-in.',
      };
    }
    if (!request) return { ok: false, error: 'Sign-in is still preparing. Try again in a moment.' };

    const result = await promptAsync();

    // AniList returns the token in the redirect's fragment and does not echo the
    // `state` we sent, which expo-auth-session reports as a state mismatch. The
    // token still arrived over our own registered `maru://auth` redirect, which
    // no other app can claim, so read it before trusting the result type.
    const { params, accessToken } = resultToken(result);

    if (!accessToken) {
      if (result.type === 'cancel' || result.type === 'dismiss') return { ok: false };
      const described = params.error_description ?? params.error;
      return {
        ok: false,
        error: described
          ? `AniList refused the sign-in: ${described}`
          : 'AniList did not return an access token.',
      };
    }

    // `expires_in` is seconds from now (AniList issues a year).
    const lifetime = Number(params.expires_in);
    const expiresAt =
      Number.isFinite(lifetime) && lifetime > 0 ? Date.now() + lifetime * 1000 : null;

    await storeToken(accessToken, expiresAt);
    setToken(accessToken);
    setGuest(false);
    await writeItem(GUEST_KEY, null);
    await loadViewer();
    return { ok: true };
  }, [request, promptAsync, loadViewer]);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    void writeItem(GUEST_KEY, 'true');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void storeToken(null);
      setToken(null);
      setViewer(null);
    });
  }, []);

  const signOut = useCallback(async () => {
    await storeToken(null);
    setToken(null);
    setViewer(null);
    setGuest(false);
    await writeItem(GUEST_KEY, null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      token,
      viewer,
      guest,
      signedIn: !!token,
      configured: !!CLIENT_ID,
      signIn,
      continueAsGuest,
      signOut,
      refreshViewer: loadViewer,
    }),
    [ready, token, viewer, guest, signIn, continueAsGuest, signOut, loadViewer]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
