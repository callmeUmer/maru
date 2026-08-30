import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StickyBar } from '../../src/components/StickyBar';
import { Press, Segmented, Toggle } from '../../src/components/primitives';
import { TitleLanguage, useSettings } from '../../src/state/settings';
import { useTheme } from '../../src/theme/ThemeProvider';
import { THEMES, THEME_ORDER, Theme } from '../../src/theme/tokens';
import { display, mono, sans } from '../../src/theme/type';

/** Screen 9 — the theme picker. Each preview is built from that theme's own tokens. */
export default function AppearanceScreen() {
  const { tokens: t, themeId, matchSystem, setThemeId, setMatchSystem } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();

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
          <Text style={[display(20, 700, { ls: -0.02, color: t.fg }), { flex: 1 }]}>Appearance</Text>
        </View>
      </StickyBar>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <View style={{ gap: 11, paddingHorizontal: 16, paddingTop: 18 }}>
          <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>Theme</Text>
          {THEME_ORDER.map((id) => (
            <ThemeRow key={id} theme={THEMES[id]} active={id === themeId} onPress={() => setThemeId(id)} />
          ))}

          <View
            style={{
              flexDirection: 'row',
              gap: 11,
              alignItems: 'center',
              padding: 12,
              borderRadius: 16,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
              borderStyle: 'dashed',
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                backgroundColor: t.bg3,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={sans(18, 400, { color: t.fg3 })}>+</Text>
            </View>
            <View style={{ gap: 4, flex: 1 }}>
              <Text style={display(13, 600, { color: t.fg })}>Create a theme</Text>
              <Text style={sans(10.5, 400, { lh: 1.35, color: t.fg2 })}>
                Twelve tokens, one screen. Shareable by link.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 11, paddingHorizontal: 16, paddingTop: 24 }}>
          <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>Match system</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text style={sans(12.5, 500, { color: t.fg })}>Follow device light / dark</Text>
            <Toggle value={matchSystem} onChange={setMatchSystem} />
          </View>
        </View>

        <View style={{ gap: 11, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 22 }}>
          <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>Title language</Text>
          <Segmented<TitleLanguage>
            value={settings.titleLanguage}
            onChange={(v) => settings.set('titleLanguage', v)}
            options={[
              { value: 'romaji', label: 'Romaji' },
              { value: 'english', label: 'English' },
              { value: 'native', label: 'Native' },
            ]}
          />
          <Press
            onPress={() => settings.set('posterColumns', settings.posterColumns === 4 ? 2 : ((settings.posterColumns + 1) as 2 | 3 | 4))}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text style={sans(12.5, 500, { color: t.fg })}>Poster grid density</Text>
            <Text style={mono(11.5, 500, { color: t.fg2 })}>{settings.posterColumns} COLUMNS ›</Text>
          </Press>
        </View>
      </ScrollView>
    </View>
  );
}

function ThemeRow({ theme, active, onPress }: { theme: Theme; active: boolean; onPress: () => void }) {
  const { tokens: t } = useTheme();
  const own = theme.tokens;

  return (
    <Press
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={{
        flexDirection: 'row',
        gap: 13,
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        backgroundColor: t.bg2,
        borderWidth: 1,
        borderColor: t.line,
      }}
    >
      <View
        style={{
          width: 58,
          height: 82,
          borderRadius: 11,
          overflow: 'hidden',
          gap: 5,
          padding: 8,
          backgroundColor: own.bg,
          borderWidth: 1,
          borderColor: t.line,
        }}
      >
        <View style={{ height: 7, borderRadius: 3, backgroundColor: own.acc, width: '70%' }} />
        <View style={{ height: 5, borderRadius: 3, backgroundColor: own.bg3 }} />
        <View style={{ height: 5, borderRadius: 3, backgroundColor: own.bg3, width: '80%' }} />
        <View style={{ marginTop: 'auto', height: 12, borderRadius: 4, backgroundColor: own.acc2, width: '50%' }} />
      </View>

      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Text style={display(14.5, 600, { color: t.fg })}>{theme.name}</Text>
        <Text style={mono(9.5, 500, { ls: 0.06, upper: true, color: t.fg2 })}>{theme.note}</Text>
        <View style={{ flexDirection: 'row', gap: 5, paddingTop: 2 }}>
          {[own.bg, own.bg3, own.acc, own.acc2].map((color, i) => (
            <View
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 5,
                backgroundColor: color,
                borderWidth: i === 0 ? 1 : 0,
                borderColor: t.line,
              }}
            />
          ))}
        </View>
      </View>

      {active ? (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: t.acc,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={sans(12, 600, { color: t.onAcc })}>✓</Text>
        </View>
      ) : null}
    </Press>
  );
}
