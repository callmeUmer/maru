import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { THEMES, Theme, ThemeId, Tokens } from './tokens';

const THEME_KEY = 'maru.theme';
const MATCH_KEY = 'maru.theme.matchSystem';

type ThemeContextValue = {
  theme: Theme;
  tokens: Tokens;
  themeId: ThemeId;
  /** When on, light/dark follows the OS and `themeId` only picks the dark variant. */
  matchSystem: boolean;
  setThemeId: (id: ThemeId) => void;
  setMatchSystem: (on: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>('midnight');
  const [matchSystem, setMatchSystemState] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet([THEME_KEY, MATCH_KEY]).then((pairs) => {
      if (!alive) return;
      const stored = Object.fromEntries(pairs);
      const id = stored[THEME_KEY] as ThemeId | undefined;
      if (id && THEMES[id]) setThemeIdState(id);
      if (stored[MATCH_KEY] === 'true') setMatchSystemState(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    void AsyncStorage.setItem(THEME_KEY, id);
  }, []);

  const setMatchSystem = useCallback((on: boolean) => {
    setMatchSystemState(on);
    void AsyncStorage.setItem(MATCH_KEY, String(on));
  }, []);

  const theme = useMemo(() => {
    const chosen = THEMES[themeId];
    if (!matchSystem) return chosen;
    if (system === 'light') return THEMES.daylight;
    return chosen.dark ? chosen : THEMES.midnight;
  }, [themeId, matchSystem, system]);

  // Paint the root view too, so a theme switch never flashes the OS default behind the app.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.tokens.bg);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, tokens: theme.tokens, themeId, matchSystem, setThemeId, setMatchSystem }),
    [theme, themeId, matchSystem, setThemeId, setMatchSystem]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/** Shorthand for the common case of only needing the token colours. */
export function useTokens() {
  return useTheme().tokens;
}
