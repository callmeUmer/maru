import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useTokens } from '../theme/ThemeProvider';
import { R } from '../theme/tokens';
import { display, mono, sans, sectionLabel } from '../theme/type';

/** Press feedback: opacity → .85, 120ms — used everywhere a row or chip is tappable. */
export function Press({ style, children, ...rest }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      style={({ pressed }) => [style, pressed && { opacity: 0.85 }]}
      android_ripple={undefined}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTokens();
  return <Text style={[sectionLabel(t.fg3), style]}>{children}</Text>;
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTokens();
  return (
    <View style={styles.sectionHead}>
      <Text style={display(16, 700, { ls: -0.015, color: t.fg })}>{title}</Text>
      {action ? (
        <Press onPress={onAction} hitSlop={8}>
          <Text style={mono(10, 500, { ls: 0.06, upper: true, color: t.acc })}>{action}</Text>
        </Press>
      ) : null}
    </View>
  );
}

/** Rounded filter chip. `fill` picks between the accent and the `fg`-filled variant. */
export function Pill({
  label,
  active,
  onPress,
  fill = 'acc',
  radius = R.pill,
  font = 'sans',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  fill?: 'acc' | 'fg';
  radius?: number;
  font?: 'sans' | 'mono';
}) {
  const t = useTokens();
  const activeBg = fill === 'acc' ? t.acc : t.fg;
  const activeFg = fill === 'acc' ? t.onAcc : t.bg;
  const textStyle =
    font === 'mono' ? mono(10.5, 600, { color: active ? activeFg : t.fg2 }) : sans(11, 600, { color: active ? activeFg : t.fg2 });

  return (
    <Press
      onPress={onPress}
      style={{
        flexGrow: 0,
        flexShrink: 0,
        paddingHorizontal: font === 'mono' ? 11 : 12,
        paddingVertical: font === 'mono' ? 6 : 7,
        borderRadius: radius,
        backgroundColor: active ? activeBg : t.bg2,
        borderWidth: active ? 0 : 1,
        borderColor: t.line,
      }}
    >
      <Text style={textStyle}>{label}</Text>
    </Press>
  );
}

export function Card({
  children,
  style,
  padding = 12,
  radius = R.card,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
}) {
  const t = useTokens();
  return (
    <View
      style={[
        { backgroundColor: t.bg2, borderColor: t.line, borderWidth: 1, borderRadius: radius, padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProgressBar({
  value,
  height = 3,
  track,
  fill,
}: {
  /** 0–1. */
  value: number;
  height?: number;
  track?: string;
  fill?: string;
}) {
  const t = useTokens();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track ?? t.bg3, overflow: 'hidden' }}>
      <View
        style={{ height: '100%', borderRadius: height, backgroundColor: fill ?? t.acc, width: `${clamped * 100}%` }}
      />
    </View>
  );
}

/** 42×25 track, 19px knob — `acc` + `on-acc` knob when on, `bg` + `fg3` knob when off. */
export function Toggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  const t = useTokens();
  return (
    <Press
      onPress={() => onChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        width: 42,
        height: 25,
        borderRadius: R.pill,
        borderWidth: 1,
        borderColor: value ? 'transparent' : t.line,
        backgroundColor: value ? t.acc : t.bg,
        padding: 2,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View style={{ width: 19, height: 19, borderRadius: R.pill, backgroundColor: value ? t.onAcc : t.fg3 }} />
    </Press>
  );
}

export function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const t = useTokens();
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 4 }} padding={11} radius={12}>
      <Text style={display(19, 700, { color: accent ? t.acc : t.fg })}>{value}</Text>
      <Text style={mono(8.5, 500, { ls: 0.08, color: t.fg3 })}>{label}</Text>
    </Card>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12, backgroundColor: t.bg3 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Press
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 9,
              borderRadius: 9,
              backgroundColor: active ? t.acc : 'transparent',
            }}
          >
            <Text style={sans(11.5, 600, { color: active ? t.onAcc : t.fg2 })}>{opt.label}</Text>
          </Press>
        );
      })}
    </View>
  );
}

/** One Grotesk line, one `fg2` line, one `acc` action. */
export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  const t = useTokens();
  return (
    <View style={styles.empty}>
      <Text style={display(17, 700, { ls: -0.02, color: t.fg })}>{title}</Text>
      <Text style={[sans(12.5, 400, { lh: 1.5, color: t.fg2 }), { textAlign: 'center' }]}>{body}</Text>
      {action ? (
        <Press onPress={onAction} hitSlop={8}>
          <Text style={mono(11, 600, { ls: 0.06, upper: true, color: t.acc })}>{action}</Text>
        </Press>
      ) : null}
    </View>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTokens();
  return <View style={[{ height: 1, backgroundColor: t.line }, style]} />;
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 48 },
});
