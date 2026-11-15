import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';

import { useSvgId } from '@/lib/useSvgId';

type Props = { size?: number; rise?: boolean; rays?: boolean };

/** Солнце рассвета: мягкий диск, ореол и медленно вращающиеся лучи. `rise` — плавный восход снизу. */
export function Sun({ size = 240, rise = true, rays = true }: Props) {
  const ids = { halo: useSvgId('sunHalo'), disc: useSvgId('sunDisc') };
  const up = useSharedValue(rise ? 0 : 1);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (rise) up.value = withDelay(300, withTiming(1, { duration: 2400, easing: Easing.out(Easing.cubic) }));
    spin.value = withRepeat(
      withTiming(1, { duration: 90_000, easing: Easing.linear, reduceMotion: ReduceMotion.System }),
      -1,
    );
  }, [rise, up, spin]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: up.value,
    transform: [{ translateY: (1 - up.value) * size * 0.6 }],
  }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  const c = size / 2;
  const disc = size * 0.2;
  const rayCount = 16;

  return (
    <Animated.View style={[{ width: size, height: size }, riseStyle]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id={ids.halo} cx="50%" cy="50%" r="50%">
            <Stop offset="0.3" stopColor="#FFD66B" stopOpacity={0.55} />
            <Stop offset="0.62" stopColor="#FFC06B" stopOpacity={0.18} />
            <Stop offset="1" stopColor="#FFB86B" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={c} fill={`url(#${ids.halo})`} />
      </Svg>
      {rays && (
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, spinStyle]}>
          <Svg width={size} height={size}>
            {Array.from({ length: rayCount }, (_, i) => {
              const a = (i / rayCount) * Math.PI * 2;
              const long = i % 2 === 0;
              const r1 = disc + size * 0.07;
              const r2 = disc + size * (long ? 0.19 : 0.13);
              return (
                <Line
                  key={i}
                  x1={c + Math.cos(a) * r1}
                  y1={c + Math.sin(a) * r1}
                  x2={c + Math.cos(a) * r2}
                  y2={c + Math.sin(a) * r2}
                  stroke="#FFE08A"
                  strokeOpacity={long ? 0.75 : 0.5}
                  strokeWidth={size * 0.014}
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>
        </Animated.View>
      )}
      <View style={{ position: 'absolute' }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={ids.disc} cx="42%" cy="38%" r="70%">
              <Stop offset="0" stopColor="#FFF8D9" />
              <Stop offset="0.6" stopColor="#FFDE7D" />
              <Stop offset="1" stopColor="#FFC65A" />
            </RadialGradient>
          </Defs>
          <Circle cx={c} cy={c} r={disc} fill={`url(#${ids.disc})`} />
        </Svg>
      </View>
    </Animated.View>
  );
}
