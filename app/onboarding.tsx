import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, Text, View } from 'react-native';

import { useDiscover } from '../src/api/hooks';
import { Cover } from '../src/components/Cover';
import { Press } from '../src/components/primitives';
import { useToast } from '../src/components/Toast';
import { useAuth } from '../src/state/auth';
import { useTheme } from '../src/theme/ThemeProvider';
import { mono, display, sans } from '../src/theme/type';

const COLLAGE_COLUMNS = 4;
const COLLAGE_COUNT = 12;

/** Screen 12 — the only route reachable without a session. */
export default function Onboarding() {
  const { tokens: t } = useTheme();
  const { signIn, continueAsGuest, configured } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data } = useDiscover();

  const covers = (data?.trending.media ?? []).slice(0, COLLAGE_COUNT);
  const width = Dimensions.get('window').width;
  const cell = (width + 80 - 12 * (COLLAGE_COLUMNS - 1)) / COLLAGE_COLUMNS;

  const onSignIn = async () => {
    setBusy(true);
    const result = await signIn();
    setBusy(false);
    if (!result.ok && result.error) toast.show(result.error);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          top: -30,
          left: -40,
          right: -40,
          height: 430,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          opacity: 0.5,
          transform: [{ rotate: '-9deg' }],
        }}
        pointerEvents="none"
      >
        {Array.from({ length: COLLAGE_COUNT }, (_, i) => (
          <Cover
            key={i}
            uri={covers[i]?.coverImage?.large}
            radius={8}
            style={{ width: cell, aspectRatio: 2 / 3 }}
          />
        ))}
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0.1)', t.bg, t.bg]}
        locations={[0, 0.52, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      <View style={{ flex: 1, justifyContent: 'flex-end', gap: 26, paddingHorizontal: 22, paddingBottom: 54 }}>
        <View style={{ gap: 14 }}>
          <Text style={mono(16, 700, { ls: 0.32, color: t.acc })}>MARU</Text>
          <Text style={display(38, 700, { lh: 1.02, ls: -0.035, color: t.fg })}>
            Everything you watch, in one calm place.
          </Text>
          <Text style={[sans(14, 400, { lh: 1.55, color: t.fg2 }), { maxWidth: '88%' }]}>
            Sync your AniList library, track episodes as they air, and get recommendations that explain themselves.
          </Text>
        </View>

        <View style={{ gap: 11 }}>
          <Press
            onPress={onSignIn}
            disabled={busy}
            style={{
              height: 52,
              borderRadius: 15,
              backgroundColor: t.acc,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.7 : 1,
            }}
          >
            <Text style={sans(15, 600, { color: t.onAcc })}>
              {busy ? 'Opening AniList…' : 'Continue with AniList'}
            </Text>
          </Press>
          <Press
            onPress={continueAsGuest}
            style={{
              height: 52,
              borderRadius: 15,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={sans(15, 600, { color: t.fg })}>Browse as guest</Text>
          </Press>
          <Text style={[sans(10.5, 400, { lh: 1.5, color: t.fg3 }), { textAlign: 'center', paddingTop: 4 }]}>
            {configured
              ? 'Uses the public AniList GraphQL API. We never see your password.'
              : 'Powered by AniList. Add an AniList client id to app.json to enable sign-in.'}
          </Text>
        </View>
      </View>
    </View>
  );
}
