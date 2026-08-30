import React from 'react';
import { Text, View } from 'react-native';

import { compact } from '../lib/format';
import { useTokens } from '../theme/ThemeProvider';
import { mono, sans } from '../theme/type';
import { Card } from './primitives';

export type Bucket = { label: string; value: number };

/**
 * Score distribution — ten buckets, each bar a share of the tallest.
 * One series, so no legend: the card header names it.
 */
export function ScoreHistogram({
  buckets,
  title,
  caption,
  height = 78,
  bare,
}: {
  buckets: Bucket[];
  title: string;
  caption?: string;
  height?: number;
  /** Profile renders this without the card chrome. */
  bare?: boolean;
}) {
  const t = useTokens();
  const max = Math.max(1, ...buckets.map((b) => b.value));

  const body = (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>{title}</Text>
        {caption ? <Text style={mono(9.5, 500, { color: t.fg2 })}>{caption}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height }}>
        {buckets.map((b) => (
          <View key={b.label} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
            <View
              style={{
                width: '100%',
                height: `${Math.max(2, (b.value / max) * 100)}%`,
                backgroundColor: t.acc,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {buckets.map((b) => (
          <Text key={b.label} style={[mono(8, 500, { color: t.fg3 }), { flex: 1, textAlign: 'center' }]}>
            {b.label}
          </Text>
        ))}
      </View>
    </>
  );

  if (bare) return <View style={{ gap: 11 }}>{body}</View>;
  return (
    <Card style={{ gap: 11 }} padding={14} radius={16}>
      {body}
    </Card>
  );
}

export type Segment = { label: string; value: number; color: string };

/**
 * Status distribution — a 10px stacked bar with 2px gaps, over a legend that
 * names and counts every segment. The legend is not optional: the `bg3` segment
 * sits at roughly 1:1 contrast against the card, so the labels are what carry it.
 */
export function StackedBar({ segments, title }: { segments: Segment[]; title: string }) {
  const t = useTokens();
  const total = Math.max(1, segments.reduce((sum, s) => sum + s.value, 0));

  return (
    <Card style={{ gap: 11 }} padding={14} radius={16}>
      <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>{title}</Text>
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        {segments.map((s) => (
          <View key={s.label} style={{ height: '100%', flex: Math.max(0.001, s.value / total), backgroundColor: s.color }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 7, columnGap: 14 }}>
        {segments.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, width: '45%' }}>
            <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={[sans(10.5, 500, { color: t.fg2 }), { flex: 1 }]}>{s.label}</Text>
            <Text style={mono(9.5, 500, { color: t.fg })}>{compact(s.value)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

/** Genre overview / format breakdown — label, count, and a 6px magnitude bar. */
export function BarList({
  rows,
  accent,
}: {
  rows: { label: string; value: number }[];
  accent?: 'acc' | 'acc2';
}) {
  const t = useTokens();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fill = accent === 'acc2' ? t.acc2 : t.acc;

  return (
    <View style={{ gap: 11 }}>
      {rows.map((r) => (
        <View key={r.label} style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={sans(11.5, 500, { color: t.fg })}>{r.label}</Text>
            <Text style={mono(10, 500, { color: t.fg2 })}>{compact(r.value)}</Text>
          </View>
          <View style={{ height: 6, borderRadius: 6, backgroundColor: t.bg3 }}>
            <View style={{ height: '100%', borderRadius: 6, backgroundColor: fill, width: `${(r.value / max) * 100}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
}
