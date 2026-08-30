import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ScoreFormat } from '../api/types';

export type TitleLanguage = 'romaji' | 'english' | 'native';

export type Settings = {
  titleLanguage: TitleLanguage;
  scoreFormat: ScoreFormat;
  posterColumns: 2 | 3 | 4;
  adultContent: boolean;
  dataSaver: boolean;
  privateByDefault: boolean;
  splitCompletedByFormat: boolean;
  advancedScores: boolean;
  notifyAiring: boolean;
  notifyFollows: boolean;
  notifyLikes: boolean;
  notifyForum: boolean;
  defaultListOrder: 'score' | 'title' | 'progress' | 'updated';
};

const DEFAULTS: Settings = {
  titleLanguage: 'romaji',
  scoreFormat: 'POINT_10_DECIMAL',
  posterColumns: 3,
  adultContent: false,
  dataSaver: false,
  privateByDefault: false,
  splitCompletedByFormat: false,
  advancedScores: true,
  notifyAiring: true,
  notifyFollows: true,
  notifyLikes: false,
  notifyForum: true,
  defaultListOrder: 'score',
};

const KEY = 'maru.settings';

type SettingsValue = Settings & {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  toggle: (key: BooleanSettingKey) => void;
};

type BooleanSettingKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!alive || !raw) return;
      try {
        setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
      } catch {
        // A corrupt blob is not worth surfacing; defaults are a fine fallback.
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    void AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const set = useCallback<SettingsValue['set']>(
    (key, value) => persist({ ...settings, [key]: value }),
    [settings, persist]
  );

  const toggle = useCallback(
    (key: BooleanSettingKey) => persist({ ...settings, [key]: !settings[key] }),
    [settings, persist]
  );

  const value = useMemo<SettingsValue>(() => ({ ...settings, set, toggle }), [settings, set, toggle]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
