import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTokens } from '../theme/ThemeProvider';
import { R } from '../theme/tokens';
import { display, mono, sans } from '../theme/type';
import { Press } from './primitives';

export type PickerOption<T extends string | number> = { value: T; label: string };

/**
 * The sheet behind the `GENRE · 2 ▾` / `YEAR ▾` / `SORT ▾` dropdowns and the
 * settings rows that carry a value. Multi-select keeps the sheet open.
 */
export function PickerSheet<T extends string | number>({
  visible,
  title,
  options,
  selected,
  multi,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selected: T[];
  multi?: boolean;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  const t = useTokens();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '72%',
          backgroundColor: t.bg2,
          borderTopLeftRadius: R.sheet,
          borderTopRightRadius: R.sheet,
          borderTopWidth: 1,
          borderColor: t.line,
          paddingBottom: Math.max(28, insets.bottom + 12),
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ width: 38, height: 4, borderRadius: 4, backgroundColor: t.fg3 }} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingBottom: 12,
          }}
        >
          <Text style={display(17, 700, { ls: -0.02, color: t.fg })}>{title}</Text>
          <Press onPress={onClose} hitSlop={8}>
            <Text style={mono(10.5, 600, { ls: 0.06, upper: true, color: t.acc })}>Done</Text>
          </Press>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          {options.map((opt) => {
            const on = selected.includes(opt.value);
            return (
              <Press
                key={String(opt.value)}
                onPress={() => {
                  onSelect(opt.value);
                  if (!multi) onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderColor: t.line,
                }}
              >
                <Text style={sans(13, on ? 600 : 500, { color: on ? t.fg : t.fg2 })}>{opt.label}</Text>
                {on ? (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: R.pill,
                      backgroundColor: t.acc,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={sans(11, 600, { color: t.onAcc })}>✓</Text>
                  </View>
                ) : null}
              </Press>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
