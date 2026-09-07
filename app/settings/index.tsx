import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { ScoreFormat } from '../../src/api/types';
import { Cover } from '../../src/components/Cover';
import { PickerSheet } from '../../src/components/PickerSheet';
import { StickyBar } from '../../src/components/StickyBar';
import { useToast } from '../../src/components/Toast';
import { Press, Toggle } from '../../src/components/primitives';
import { relativeTime } from '../../src/lib/format';
import { useAuth } from '../../src/state/auth';
import { useSettings } from '../../src/state/settings';
import { useTokens } from '../../src/theme/ThemeProvider';
import { display, mono, sans } from '../../src/theme/type';

const SCORE_FORMATS: { value: ScoreFormat; label: string }[] = [
  { value: 'POINT_10_DECIMAL', label: '10-point decimal' },
  { value: 'POINT_100', label: '100 point' },
  { value: 'POINT_10', label: '10 point' },
  { value: 'POINT_5', label: '5 stars' },
  { value: 'POINT_3', label: '3 point smiley' },
];

const LIST_ORDERS = [
  { value: 'score', label: 'Score' },
  { value: 'title', label: 'Title' },
  { value: 'progress', label: 'Progress' },
  { value: 'updated', label: 'Recently updated' },
] as const;

/** Screen 8 — settings, reached from the profile gear. */
export default function SettingsScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { viewer, signOut, refreshViewer, signedIn } = useAuth();
  const settings = useSettings();

  const [picker, setPicker] = useState<'score' | 'order' | null>(null);
  const [syncedAt, setSyncedAt] = useState(() => Math.floor(Date.now() / 1000));

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const sync = async () => {
    await refreshViewer();
    await queryClient.invalidateQueries();
    setSyncedAt(Math.floor(Date.now() / 1000));
    toast.show('Synced with AniList.', 'info');
  };

  const clearImageCache = async () => {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
    toast.show('Image cache cleared.', 'info');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StickyBar edge="bottom">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingTop: insets.top + 6,
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          <Press onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
            <Text style={sans(20, 500, { color: t.acc })}>‹</Text>
          </Press>
          <Text style={[display(20, 700, { ls: -0.02, color: t.fg }), { flex: 1 }]}>Settings</Text>
          <Text style={mono(10.5, 600, { color: t.fg3 })}>v{version}</Text>
        </View>
      </StickyBar>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            margin: 16,
            padding: 12,
            borderRadius: 16,
            backgroundColor: t.bg2,
            borderWidth: 1,
            borderColor: t.line,
          }}
        >
          <Cover uri={viewer?.avatar?.large} radius={14} stripe={[4, 9]} bordered={false} style={{ width: 46, height: 46 }} />
          <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
            <Text numberOfLines={1} style={display(14.5, 600, { color: t.fg })}>
              {viewer?.name ?? 'Guest'}
            </Text>
            <Text style={mono(9.5, 500, { ls: 0.05, upper: true, color: t.fg2 })}>
              {signedIn ? `Synced ${relativeTime(syncedAt)} ago · AniList` : 'Not signed in · AniList'}
            </Text>
          </View>
          {signedIn ? (
            <Press
              onPress={sync}
              style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9, backgroundColor: t.acc }}
            >
              <Text style={mono(10.5, 600, { color: t.onAcc })}>SYNC</Text>
            </Press>
          ) : null}
        </View>

        <SectionHeader>Account</SectionHeader>
        <Row label="AniList account" value={viewer?.name ?? 'Sign in'} onPress={() => !signedIn && router.replace('/onboarding')} />
        <Row label="Display name" value={viewer?.name ?? '—'} />
        <Row
          label="About / bio"
          value="Edit"
          onPress={() => WebBrowser.openBrowserAsync('https://anilist.co/settings').catch(() => {})}
        />
        <Row label="Linked services" value="AniList" />

        <SectionHeader>Lists & scoring</SectionHeader>
        <Row
          label="Scoring format"
          value={SCORE_FORMATS.find((s) => s.value === settings.scoreFormat)?.label ?? '—'}
          onPress={() => setPicker('score')}
        />
        <Row
          label="Default list order"
          value={LIST_ORDERS.find((o) => o.value === settings.defaultListOrder)?.label ?? '—'}
          onPress={() => setPicker('order')}
        />
        <ToggleRow label="Advanced scores" value={settings.advancedScores} onChange={() => settings.toggle('advancedScores')} />
        <ToggleRow
          label="Split completed by format"
          value={settings.splitCompletedByFormat}
          onChange={() => settings.toggle('splitCompletedByFormat')}
        />
        <ToggleRow
          label="Private entries by default"
          value={settings.privateByDefault}
          onChange={() => settings.toggle('privateByDefault')}
        />
        <Row label="Custom lists" value="On AniList" onPress={() => WebBrowser.openBrowserAsync('https://anilist.co/settings/lists').catch(() => {})} />

        <SectionHeader>Notifications</SectionHeader>
        <ToggleRow label="Airing episodes" value={settings.notifyAiring} onChange={() => settings.toggle('notifyAiring')} />
        <ToggleRow label="New followers" value={settings.notifyFollows} onChange={() => settings.toggle('notifyFollows')} />
        <ToggleRow label="Likes & replies" value={settings.notifyLikes} onChange={() => settings.toggle('notifyLikes')} />
        <ToggleRow label="Forum mentions" value={settings.notifyForum} onChange={() => settings.toggle('notifyForum')} />
        <Row label="Quiet hours" value="23:00 – 08:00" />

        <SectionHeader>App</SectionHeader>
        <Row label="Appearance" value="Theme" onPress={() => router.push('/settings/appearance')} />
        <Row
          label="Title language"
          value={settings.titleLanguage.charAt(0).toUpperCase() + settings.titleLanguage.slice(1)}
          onPress={() => router.push('/settings/appearance')}
        />
        <ToggleRow label="Adult content" value={settings.adultContent} onChange={() => settings.toggle('adultContent')} />
        <ToggleRow label="Data saver" value={settings.dataSaver} onChange={() => settings.toggle('dataSaver')} />
        <Row label="Clear image cache" value="Clear" onPress={clearImageCache} />

        <SectionHeader>Session</SectionHeader>
        <Row label="Privacy policy" value="" onPress={() => router.push('/settings/privacy')} />
        <Row
          label="Revoke access on AniList"
          value=""
          onPress={() => WebBrowser.openBrowserAsync('https://anilist.co/settings/apps').catch(() => {})}
        />
        <Row
          label="Sign out"
          value=""
          onPress={async () => {
            await signOut();
            queryClient.clear();
            router.replace('/onboarding');
          }}
        />

        <Text
          style={[
            sans(10.5, 400, { lh: 1.5, color: t.fg3 }),
            { textAlign: 'center', paddingHorizontal: 32, paddingTop: 22 },
          ]}
        >
          MARU is an independent client, powered by the public AniList GraphQL API. Not affiliated with AniList.
        </Text>
      </ScrollView>

      <PickerSheet
        visible={picker === 'score'}
        title="Scoring format"
        options={SCORE_FORMATS}
        selected={[settings.scoreFormat]}
        onSelect={(v) => settings.set('scoreFormat', v as ScoreFormat)}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        visible={picker === 'order'}
        title="Default list order"
        options={LIST_ORDERS.map((o) => ({ value: o.value, label: o.label }))}
        selected={[settings.defaultListOrder]}
        onSelect={(v) => settings.set('defaultListOrder', v as typeof settings.defaultListOrder)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  const t = useTokens();
  return (
    <Text
      style={[
        mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 }),
        { paddingTop: 20, paddingBottom: 8, paddingHorizontal: 16 },
      ]}
    >
      {children}
    </Text>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const t = useTokens();
  return (
    <Press
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: t.bg2,
        borderTopWidth: 1,
        borderColor: t.line,
      }}
    >
      <Text style={sans(12.5, 500, { color: t.fg })}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? (
          <Text numberOfLines={1} style={sans(11.5, 500, { color: t.fg2 })}>
            {value}
          </Text>
        ) : null}
        <Text style={sans(14, 500, { color: t.fg3 })}>›</Text>
      </View>
    </Press>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  const t = useTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: t.bg2,
        borderTopWidth: 1,
        borderColor: t.line,
      }}
    >
      <Text style={sans(12.5, 500, { color: t.fg })}>{label}</Text>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}
