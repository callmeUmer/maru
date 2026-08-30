import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { gqlRequest, setTokenGetter, setUnauthorizedHandler } from '../api/client';
import { VIEWER } from '../api/queries';
import { Viewer } from '../api/types';

const TOKEN_KEY = 'maru.anilist.token';
const GUEST_KEY = 'maru.guest';

/**
 * AniList issues implicit-grant tokens to a registered client. Set the id in
 * app.json under `expo.extra.anilistClientId` (or EXPO_PUBLIC_ANILIST_CLIENT_ID)
 * with `maru://auth` registered as the client's redirect URL.
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

async function storeToken(token: string | null) {
  currentToken = token;
  if (Platform.OS === 'web') return;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
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
        const stored = Platform.OS === 'web' ? null : await SecureStore.getItemAsync(TOKEN_KEY);
        const wasGuest = Platform.OS === 'web' ? null : await SecureStore.getItemAsync(GUEST_KEY);
        if (stored) {
          currentToken = stored;
          setToken(stored);
          await loadViewer();
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
    if (result.type !== 'success') {
      return { ok: false, error: result.type === 'dismiss' ? undefined : 'Sign-in was cancelled.' };
    }
    const accessToken = result.params?.access_token ?? result.authentication?.accessToken ?? null;
    if (!accessToken) return { ok: false, error: 'AniList did not return an access token.' };

    await storeToken(accessToken);
    setToken(accessToken);
    setGuest(false);
    await SecureStore.deleteItemAsync(GUEST_KEY).catch(() => {});
    await loadViewer();
    return { ok: true };
  }, [request, promptAsync, loadViewer]);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    void SecureStore.setItemAsync(GUEST_KEY, 'true').catch(() => {});
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
    await SecureStore.deleteItemAsync(GUEST_KEY).catch(() => {});
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
