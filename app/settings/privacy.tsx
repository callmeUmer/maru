import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StickyBar } from '../../src/components/StickyBar';
import { Press } from '../../src/components/primitives';
import { useTokens } from '../../src/theme/ThemeProvider';
import { display, mono, sans } from '../../src/theme/type';

/**
 * Play requires a reachable privacy policy. Shipping it as a screen rather than
 * an outbound link means it is correct for the installed version and readable
 * offline; PRIVACY.md in the repo is the same text for the store listing.
 */
const EFFECTIVE = 'Effective 7 September 2026';

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: 'What MARU collects',
    body: [
      'Nothing. MARU has no servers, no analytics, no crash reporting, no advertising and no tracking SDKs. The developer receives no data about you or your use of the app.',
    ],
  },
  {
    heading: 'What is stored on your device',
    body: [
      'Your AniList access token is kept in the Android Keystore. Your preferences — theme, scoring format, list order, toggles — and cached covers and API responses are kept in app-private storage.',
      'All of it stays in MARU’s private sandbox and is excluded from cloud backup, so your token is never copied off the device. Uninstalling the app deletes all of it.',
    ],
  },
  {
    heading: 'What is sent to AniList',
    body: [
      'If you sign in, MARU talks to the public AniList GraphQL API over HTTPS on your behalf. It sends your access token so AniList knows who you are, plus the changes you make — episode progress, scores, list status — and reads your profile, lists, notifications and activity so it can show them to you.',
      'MARU never sees your AniList password. Sign-in happens on anilist.co in a system browser tab, and AniList hands the app a token afterwards.',
      'If you browse as a guest, no token exists and no personal data is sent — only anonymous public queries for trending and seasonal titles.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'MARU is not directed at children under 13. Adult content is off by default and can only be enabled by users whose AniList account permits it.',
    ],
  },
  {
    heading: 'Deleting your data',
    body: [
      'Signing out erases the stored token and cached account data from this device immediately. Uninstalling removes everything MARU has stored.',
      'To revoke MARU’s access from the AniList side, visit anilist.co/settings/apps. Deleting your AniList account itself is done at AniList — MARU holds no account of its own.',
    ],
  },
];

const LINKS: { label: string; url: string }[] = [
  { label: 'AniList privacy policy & terms', url: 'https://anilist.co/terms' },
  { label: 'Revoke MARU’s access', url: 'https://anilist.co/settings/apps' },
];

export default function PrivacyScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          <Text style={[display(20, 700, { ls: -0.02, color: t.fg }), { flex: 1 }]}>Privacy</Text>
        </View>
      </StickyBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28, gap: 22 }}>
        <View style={{ gap: 8 }}>
          <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>{EFFECTIVE}</Text>
          <Text style={sans(13, 400, { lh: 1.6, color: t.fg2 })}>
            MARU is an independent, open-source client for AniList. It has no servers of its own.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={{ gap: 8 }}>
            <Text style={display(15, 600, { ls: -0.01, color: t.fg })}>{section.heading}</Text>
            {section.body.map((paragraph, i) => (
              <Text key={i} style={sans(13, 400, { lh: 1.6, color: t.fg2 })}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <View style={{ gap: 10, paddingTop: 4 }}>
          {LINKS.map((link) => (
            <Press
              key={link.url}
              onPress={() => WebBrowser.openBrowserAsync(link.url).catch(() => {})}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: t.bg2,
                borderWidth: 1,
                borderColor: t.line,
              }}
            >
              <Text style={sans(12.5, 500, { color: t.fg })}>{link.label}</Text>
              <Text style={sans(14, 500, { color: t.fg3 })}>›</Text>
            </Press>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
