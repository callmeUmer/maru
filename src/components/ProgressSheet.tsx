import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Media, MediaListStatus } from '../api/types';
import { formatScore, fuzzyDate, pickTitle, scoreMax } from '../lib/format';
import { useListCache } from '../state/listCache';
import { useSettings } from '../state/settings';
import { useTokens } from '../theme/ThemeProvider';
import { R } from '../theme/tokens';
import { display, mono, sans } from '../theme/type';
import { Cover } from './Cover';
import { DateField } from './DateField';
import { Press, ProgressBar, Toggle } from './primitives';

const STATUSES: MediaListStatus[] = ['CURRENT', 'PLANNING', 'COMPLETED', 'PAUSED', 'DROPPED', 'REPEATING'];

const STATUS_TEXT: Record<MediaListStatus, string> = {
  CURRENT: 'Watching',
  PLANNING: 'Planning',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
  DROPPED: 'Dropped',
  REPEATING: 'Rewatching',
};

/**
 * The episode progress editor: a bottom sheet over a dimmed list.
 * Enters bottom-up over 260ms on the design's cubic-bezier(.2,.8,.2,1); the scrim fades in 180ms.
 */
export function ProgressSheet({
  media,
  visible,
  onClose,
}: {
  media: Media | null;
  visible: boolean;
  onClose: () => void;
}) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const { titleLanguage, scoreFormat, privateByDefault } = useSettings();
  const { entries, save, remove } = useListCache();

  const entry = media ? entries[media.id] : undefined;
  const total = media ? (media.type === 'MANGA' ? media.chapters : media.episodes) : null;
  const unit = media?.type === 'MANGA' ? 'CHAPTERS' : 'EPISODES';

  const [progress, setProgress] = useState(0);
  const [scoreRaw, setScoreRaw] = useState(0);
  const [status, setStatus] = useState<MediaListStatus>('CURRENT');
  const [repeat, setRepeat] = useState(0);
  const [isPrivate, setPrivate] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setProgress(entry?.progress ?? 0);
    setScoreRaw(entry?.scoreRaw ?? 0);
    setStatus(entry?.status ?? 'CURRENT');
    setRepeat(entry?.repeat ?? 0);
    setPrivate(entry?.private ?? privateByDefault);
    setStartedAt(
      entry?.startedAt?.year
        ? new Date(entry.startedAt.year, (entry.startedAt.month ?? 1) - 1, entry.startedAt.day ?? 1)
        : null
    );
    setStatusOpen(false);
    setDateOpen(false);
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 260,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [visible, entry, privateByDefault, slide]);

  const close = () => {
    Animated.timing(slide, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
      onClose
    );
  };

  // Drag the grabber down to dismiss.
  const drag = useRef(new Animated.Value(0)).current;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
        onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120) close();
          else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [drag] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [trackWidth, setTrackWidth] = useState(0);
  const scorePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => setScoreFromX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => setScoreFromX(e.nativeEvent.locationX),
      }),
    [trackWidth] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Snap the drag to whatever granularity the user's score format actually offers. */
  function setScoreFromX(x: number) {
    if (!trackWidth) return;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    const steps = scoreFormat === 'POINT_100' || scoreFormat === 'POINT_10_DECIMAL' ? 100 : scoreMax(scoreFormat);
    setScoreRaw((Math.round(ratio * steps) / steps) * 100);
  }

  if (!media) return null;

  const pct = total ? Math.min(1, progress / total) : 0;
  const max = scoreMax(scoreFormat);

  const onSave = async () => {
    setSaving(true);
    const ok = await save(media.id, {
      progress,
      scoreRaw: Math.round(scoreRaw),
      status,
      repeat,
      private: isPrivate,
      startedAt: startedAt
        ? { year: startedAt.getFullYear(), month: startedAt.getMonth() + 1, day: startedAt.getDate() }
        : null,
    });
    setSaving(false);
    if (ok) close();
  };

  const onDelete = async () => {
    setSaving(true);
    const ok = await remove(media.id);
    setSaving(false);
    if (ok) close();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', opacity: slide }}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '92%',
          backgroundColor: t.bg2,
          borderTopWidth: 1,
          borderColor: t.line,
          borderTopLeftRadius: R.sheet,
          borderTopRightRadius: R.sheet,
          shadowColor: '#000',
          shadowOpacity: 0.45,
          shadowRadius: 50,
          shadowOffset: { width: 0, height: -20 },
          elevation: 24,
          transform: [
            { translateY: Animated.add(slide.interpolate({ inputRange: [0, 1], outputRange: [520, 0] }), drag) },
          ],
        }}
      >
        <View {...pan.panHandlers} style={{ paddingTop: 12, paddingBottom: 6, alignItems: 'center' }}>
          <View style={{ width: 38, height: 4, borderRadius: 4, backgroundColor: t.fg3 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: Math.max(40, insets.bottom + 20), gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Cover
              uri={media.coverImage?.large ?? media.coverImage?.extraLarge}
              radius={7}
              stripe={[4, 9]}
              style={{ width: 42, height: 60 }}
            />
            <View style={{ gap: 5, flex: 1 }}>
              <Text numberOfLines={2} style={display(17, 700, { lh: 1.15, ls: -0.015, color: t.fg })}>
                {pickTitle(media.title, titleLanguage)}
              </Text>
              <Text style={mono(9.5, 500, { ls: 0.06, upper: true, color: t.fg2 })}>
                {media.format ?? '—'} · {total ?? '?'} {unit}
              </Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>Progress</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Press
                onPress={() => setProgress((p) => Math.max(0, p - 1))}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  backgroundColor: t.bg3,
                  borderWidth: 1,
                  borderColor: t.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityLabel="Decrease progress"
              >
                <Text style={sans(24, 500, { color: t.fg2 })}>−</Text>
              </Press>
              <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <Text style={display(38, 700, { ls: -0.03, color: t.fg })}>{progress}</Text>
                <Text style={mono(9.5, 500, { ls: 0.08, color: t.fg3 })}>OF {total ?? '?'}</Text>
              </View>
              <Press
                onPress={() => setProgress((p) => (total ? Math.min(total, p + 1) : p + 1))}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  backgroundColor: t.acc,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityLabel="Increase progress"
              >
                <Text style={sans(24, 500, { color: t.onAcc })}>+</Text>
              </Press>
            </View>
            <ProgressBar value={pct} height={4} />
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 })}>Your score</Text>
              <Text style={display(15, 700, { color: t.acc2 })}>
                {formatScore(scoreRaw, scoreFormat)} / {max}
              </Text>
            </View>
            <View
              {...scorePan.panHandlers}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              style={{ height: 26, borderRadius: 9, backgroundColor: t.bg3, overflow: 'hidden' }}
              accessibilityRole="adjustable"
              accessibilityLabel="Your score"
            >
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${scoreRaw}%`,
                  backgroundColor: t.acc2,
                  opacity: 0.85,
                }}
              />
            </View>
          </View>

          <View style={{ borderRadius: 13, overflow: 'hidden', borderWidth: 1, borderColor: t.line, gap: 1 }}>
            <SheetRow label="Status" value={`${STATUS_TEXT[status]} ▾`} onPress={() => setStatusOpen((v) => !v)} />
            {statusOpen ? (
              <View style={{ backgroundColor: t.bg3, paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {STATUSES.map((s) => (
                  <Press
                    key={s}
                    onPress={() => {
                      setStatus(s);
                      setStatusOpen(false);
                    }}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: R.pill,
                      backgroundColor: s === status ? t.acc : t.bg2,
                      borderWidth: s === status ? 0 : 1,
                      borderColor: t.line,
                    }}
                  >
                    <Text style={sans(11, 600, { color: s === status ? t.onAcc : t.fg2 })}>{STATUS_TEXT[s]}</Text>
                  </Press>
                ))}
              </View>
            ) : null}
            <SheetRow
              label="Started"
              value={
                startedAt
                  ? fuzzyDate({
                      year: startedAt.getFullYear(),
                      month: startedAt.getMonth() + 1,
                      day: startedAt.getDate(),
                    })
                  : 'Not set'
              }
              onPress={() => setDateOpen(true)}
            />
            <SheetRow label="Rewatches" value={String(repeat)} onPress={() => setRepeat((r) => r + 1)} onLongPress={() => setRepeat(0)} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 13,
                backgroundColor: t.bg3,
              }}
            >
              <Text style={sans(12.5, 500, { color: t.fg2 })}>Private</Text>
              <Toggle value={isPrivate} onChange={setPrivate} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Press
              onPress={onDelete}
              disabled={saving}
              style={{
                width: 96,
                height: 46,
                borderRadius: 13,
                backgroundColor: t.bg3,
                borderWidth: 1,
                borderColor: t.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={sans(13, 600, { color: t.fg2 })}>Delete</Text>
            </Press>
            <Press
              onPress={onSave}
              disabled={saving}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 13,
                backgroundColor: t.acc,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Text style={sans(14, 600, { color: t.onAcc })}>{saving ? 'Saving…' : 'Save entry'}</Text>
            </Press>
          </View>
        </ScrollView>

        {dateOpen ? (
          <DateField
            value={startedAt}
            onChange={(date) => {
              setDateOpen(false);
              if (date) setStartedAt(date);
            }}
          />
        ) : null}
      </Animated.View>
    </Modal>
  );
}

function SheetRow({
  label,
  value,
  onPress,
  onLongPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const t = useTokens();
  return (
    <Press
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: t.bg3,
      }}
    >
      <Text style={sans(12.5, 500, { color: t.fg2 })}>{label}</Text>
      <Text style={sans(12.5, 600, { color: t.fg })}>{value}</Text>
    </Press>
  );
}
