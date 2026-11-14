import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Детерминированный генератор, чтобы звёзды не прыгали между рендерами.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Star = { x: number; y: number; size: number; delay: number; period: number; min: number; warm: boolean };

const Twinkle = memo(function Twinkle({ star, dim }: { star: Star; dim: boolean }) {
  const o = useSharedValue(star.min);
  useEffect(() => {
    o.value = withDelay(
      star.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: star.period, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
          withTiming(star.min, { duration: star.period, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
        ),
        -1,
      ),
    );
  }, [o, star]);
  const style = useAnimatedStyle(() => ({ opacity: o.value * (dim ? 0.55 : 1) }));
  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          borderRadius: star.size,
          backgroundColor: star.warm ? '#FFE2B8' : '#DCDDFB',
          shadowColor: star.warm ? '#FFB86B' : '#A5A8F0',
        },
        style,
      ]}
    />
  );
});

export const Starfield = memo(function Starfield({ count = 80, dim = false }: { count?: number; dim?: boolean }) {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: count }, (): Star => {
      const big = r() > 0.88;
      return {
        x: r() * width,
        // Больше звёзд вверху неба
        y: Math.pow(r(), 1.5) * height,
        size: big ? 2 + r() * 1.2 : 1 + r() * 1.1,
        delay: Math.floor(r() * 4000),
        period: 2000 + Math.floor(r() * 4000),
        min: 0.15 + r() * 0.3,
        warm: r() > 0.75,
      };
    });
  }, [count, width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s, i) => (
        <Twinkle key={i} star={s} dim={dim} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  star: { position: 'absolute', shadowOpacity: 0.9, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
});
