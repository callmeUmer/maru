import React from 'react';
import { Platform, TextInput, View } from 'react-native';

import { useTokens } from '../theme/ThemeProvider';
import { sans } from '../theme/type';

const toISO = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

/**
 * Web stand-in for the native date picker: the platform's own date input,
 * reached through React Native Web's `TextInput` escape hatch.
 */
export function DateField({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
}) {
  const t = useTokens();

  return (
    <View style={{ paddingHorizontal: 14, paddingBottom: 12, backgroundColor: t.bg3 }}>
      <TextInput
        value={toISO(value)}
        onChangeText={(text) => {
          const parsed = new Date(text);
          onChange(Number.isNaN(parsed.getTime()) ? null : parsed);
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={t.fg3}
        style={[
          sans(12.5, 600, { color: t.fg }),
          { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 9, backgroundColor: t.bg2 },
        ]}
        {...(Platform.OS === 'web' ? ({ type: 'date' } as object) : null)}
      />
    </View>
  );
}
