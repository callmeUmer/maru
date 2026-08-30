import type { BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTokens } from '../theme/ThemeProvider';
import { mono } from '../theme/type';
import { DiscoverIcon, ListIcon, ProfileIcon, SearchIcon, SocialIcon } from './Icons';
import { Press } from './primitives';
import { StickyBar } from './StickyBar';

const ICONS: Record<string, (color: string) => React.ReactNode> = {
  index: (color) => <DiscoverIcon color={color} />,
  search: (color) => <SearchIcon color={color} />,
  list: (color) => <ListIcon color={color} />,
  social: (color) => <SocialIcon color={color} />,
  profile: (color) => <ProfileIcon color={color} />,
};

const LABELS: Record<string, string> = {
  index: 'Discover',
  search: 'Search',
  list: 'My List',
  social: 'Social',
  profile: 'Profile',
};

/** Sticky bottom bar, 5 equal columns. Active = `acc`, inactive = `fg3`. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();

  // 22px of bottom padding clears the iOS home indicator; on Android the OS
  // gesture bar sits below the tab bar, so only its inset is added.
  const paddingBottom = Platform.OS === 'ios' ? Math.max(22, insets.bottom + 6) : insets.bottom + 12;

  return (
    <StickyBar edge="top">
      <View style={{ flexDirection: 'row', paddingTop: 9, paddingHorizontal: 8, paddingBottom }}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const color = focused ? t.acc : t.fg3;
          return (
            <Press
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={LABELS[route.name]}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{ flex: 1, alignItems: 'center', gap: 5 }}
            >
              {ICONS[route.name]?.(color)}
              <Text style={mono(9, 600, { ls: 0.06, upper: true, color })}>{LABELS[route.name]}</Text>
            </Press>
          );
        })}
      </View>
    </StickyBar>
  );
}
