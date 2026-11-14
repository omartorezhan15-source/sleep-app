import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';
import { fonts, night, radius } from '@/theme';
import { AppText } from './AppText';

const HOLD_MS = 1200;

/** Кнопка с удержанием: защищает от случайного «Я в кровати». */
export function HoldButton({ label, onDone }: { label: string; onDone: () => void }) {
  const progress = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    haptic.soft();
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    timer.current = setTimeout(() => {
      haptic.success();
      onDone();
    }, HOLD_MS);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 250 });
  };

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onDone}
      onPressIn={start}
      onPressOut={stop}
      style={styles.wrap}
    >
      <Animated.View style={[styles.fill, fill]} />
      <View style={styles.center}>
        <AppText style={{ fontFamily: fonts.bold, fontSize: 16 }} color={night.text} align="center">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 62,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,184,107,0.55)',
    backgroundColor: 'rgba(255,184,107,0.08)',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,184,107,0.45)' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});
