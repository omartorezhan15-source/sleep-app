import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { dawn, night, radius } from '@/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'night' | 'dawn';
  padded?: boolean;
};

/** Карточка «матовое стекло»: blur (iOS/web) + полупрозрачная заливка + тонкая обводка. */
export function Glass({ children, style, tone = 'night', padded = true }: Props) {
  const palette = tone === 'night' ? night : dawn;
  return (
    <View style={[styles.wrap, { borderColor: palette.glassBorder }, style]}>
      {Platform.OS !== 'android' && (
        <BlurView intensity={30} tint={tone === 'night' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.glass }]} />
      <View style={padded ? styles.pad : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  pad: { paddingHorizontal: 22, paddingVertical: 20 },
});
