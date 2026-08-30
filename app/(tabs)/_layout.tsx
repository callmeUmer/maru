import Tabs from 'expo-router/js-tabs';
import React from 'react';

import { TabBar } from '../../src/components/TabBar';
import { useTokens } from '../../src/theme/ThemeProvider';

/** Discover · Search · My List · Social · Profile — screens stay mounted so each keeps its scroll position. */
export default function TabLayout() {
  const t = useTokens();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="list" />
      <Tabs.Screen name="social" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
