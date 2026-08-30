import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTokens } from '../theme/ThemeProvider';
import { sans } from '../theme/type';
import { R } from '../theme/tokens';

type ToastKind = 'error' | 'info';
type ToastValue = { show: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, kind: ToastKind = 'error') => {
    setToast({ message, kind });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastView message={toast.message} kind={toast.kind} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ message, kind }: { message: string; kind: ToastKind }) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          bottom: insets.bottom + 96,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          { backgroundColor: t.bg2, borderColor: kind === 'error' ? t.acc2 : t.line },
        ]}
      >
        <Text style={sans(12.5, 500, { lh: 1.4, color: t.fg })}>{message}</Text>
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: R.button,
    borderWidth: 1,
    maxWidth: '100%',
  },
});
