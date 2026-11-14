import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';
import { dawn, fonts, night, radius } from '@/theme';
import { AppText } from './AppText';

const APressable = Animated.createAnimatedComponent(Pressable);

function usePressScale() {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return {
    style,
    onPressIn: () => (s.value = withSpring(0.96, { damping: 15, stiffness: 300 })),
    onPressOut: () => (s.value = withSpring(1, { damping: 15, stiffness: 300 })),
  };
}

type PillProps = {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'ghost';
  tone?: 'night' | 'dawn';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({ label, onPress, kind = 'primary', tone = 'night', disabled, style }: PillProps) {
  const p = usePressScale();
  const palette = tone === 'night' ? night : dawn;
  const primary = kind === 'primary';
  return (
    <APressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={[
        styles.pill,
        primary
          ? { backgroundColor: palette.accent, shadowColor: palette.accent }
          : { backgroundColor: 'transparent', borderColor: palette.glassBorder, borderWidth: 1 },
        primary && styles.pillShadow,
        disabled && { opacity: 0.4 },
        p.style,
        style,
      ]}
    >
      <AppText
        style={{ fontFamily: fonts.bold, fontSize: 17 }}
        color={primary ? palette.onAccent : tone === 'night' ? night.text : dawn.text}
      >
        {label}
      </AppText>
    </APressable>
  );
}

export function IconButton({ children, onPress, label }: { children: ReactNode; onPress: () => void; label: string }) {
  const p = usePressScale();
  return (
    <APressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={() => {
        haptic.tick();
        onPress();
      }}
      style={[styles.icon, p.style]}
    >
      <View>{children}</View>
    </APressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pillShadow: { shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: night.glass,
    borderWidth: 1,
    borderColor: night.glassBorder,
  },
});
