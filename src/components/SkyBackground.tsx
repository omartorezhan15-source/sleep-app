import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { dawn, night } from '@/theme';
import { Starfield } from './Starfield';

export type SkyMode = 'night' | 'deep' | 'dawn';

type Props = { mode?: SkyMode; stars?: boolean; children?: React.ReactNode };

/**
 * Фон-небо. Три градиента лежат друг на друге, а между режимами
 * плавно меняется прозрачность (ночь → рассвет за 1,8 с).
 */
export function SkyBackground({ mode = 'night', stars = true, children }: Props) {
  const deep = useSharedValue(mode === 'deep' ? 1 : 0);
  const dawnV = useSharedValue(mode === 'dawn' ? 1 : 0);

  useEffect(() => {
    const cfg = { duration: 1800, easing: Easing.inOut(Easing.quad) };
    deep.value = withTiming(mode === 'deep' ? 1 : 0, cfg);
    dawnV.value = withTiming(mode === 'dawn' ? 1 : 0, cfg);
  }, [mode, deep, dawnV]);

  const deepStyle = useAnimatedStyle(() => ({ opacity: deep.value }));
  const dawnStyle = useAnimatedStyle(() => ({ opacity: dawnV.value }));
  const starsStyle = useAnimatedStyle(() => ({ opacity: 1 - dawnV.value * 0.85 }));

  return (
    <View style={styles.root}>
      <LinearGradient colors={[night.bgTop, night.bgBottom]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, deepStyle]} pointerEvents="none">
        <LinearGradient colors={[night.bgDeep, '#0E1233']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, dawnStyle]} pointerEvents="none">
        <LinearGradient
          colors={['#FFC9B0', dawn.bgTop, '#FFC2C6', dawn.bgBottom]}
          locations={[0, 0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {stars && (
        <Animated.View style={[StyleSheet.absoluteFill, starsStyle]} pointerEvents="none">
          <Starfield dim={mode === 'deep'} />
        </Animated.View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: night.bgTop } });
