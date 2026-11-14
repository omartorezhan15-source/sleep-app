import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { useSvgId } from '@/lib/useSvgId';

import { MOON_MAX } from '@/store/useApp';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Фаза 1..14 → освещённая доля диска (от тонкого полумесяца до полной луны). */
export function phaseToFraction(phase: number) {
  return 0.08 + (0.92 * (Math.min(MOON_MAX, Math.max(1, phase)) - 1)) / (MOON_MAX - 1);
}

type Props = { phase: number; size?: number; glow?: boolean; tone?: 'night' | 'pale' };

/**
 * Луна в SVG. Рисуем полный светлый диск с «морями», а сверху — тень
 * (неосвещённая часть), форма которой зависит от фазы и анимируется пружиной.
 */
export function Moon({ phase, size = 220, glow = true, tone = 'night' }: Props) {
  const ids = { halo: useSvgId('halo'), lit: useSvgId('lit') };

  const f = useSharedValue(phaseToFraction(phase));
  const breath = useSharedValue(0);

  useEffect(() => {
    f.value = withSpring(phaseToFraction(phase), { damping: 18, stiffness: 60 });
  }, [phase, f]);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
      ),
      -1,
    );
  }, [breath]);

  const box = size * 1.6; // запас под ореол
  const c = box / 2;
  const r = size / 2;

  const shadowProps = useAnimatedProps(() => {
    const fr = Math.min(1, Math.max(0, f.value));
    const rx = Math.max(0.001, r * Math.abs(1 - 2 * fr));
    const sweep = fr < 0.5 ? 0 : 1;
    // Левая кромка сверху вниз, затем терминатор снизу вверх.
    return {
      d: `M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} A ${rx} ${r} 0 0 ${sweep} ${c} ${c - r} Z`,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + breath.value * 0.25,
    transform: [{ scale: 0.96 + breath.value * 0.06 }],
  }));

  const pale = tone === 'pale';

  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {glow && (
        <Animated.View style={[{ position: 'absolute', width: box, height: box }, glowStyle]}>
          <Svg width={box} height={box}>
            <Defs>
              <RadialGradient id={ids.halo} cx="50%" cy="50%" r="50%">
                <Stop offset="0.5" stopColor="#FFB86B" stopOpacity={pale ? 0.12 : 0.28} />
                <Stop offset="0.75" stopColor="#FFB86B" stopOpacity={pale ? 0.04 : 0.09} />
                <Stop offset="1" stopColor="#FFB86B" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={c} cy={c} r={c} fill={`url(#${ids.halo})`} />
          </Svg>
        </Animated.View>
      )}
      <Svg width={box} height={box} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id={ids.lit} cx="42%" cy="38%" r="65%">
            <Stop offset="0" stopColor={pale ? '#FFF8EC' : '#FFF4DE'} />
            <Stop offset="0.7" stopColor={pale ? '#F7E6CF' : '#F6DFB4'} />
            <Stop offset="1" stopColor={pale ? '#EBD3B5' : '#E9C48C'} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r} fill={`url(#${ids.lit})`} />
        {/* «Моря» — едва заметные пятна */}
        <Circle cx={c - r * 0.25} cy={c - r * 0.2} r={r * 0.22} fill="#D9B98A" opacity={0.35} />
        <Circle cx={c + r * 0.22} cy={c + r * 0.05} r={r * 0.16} fill="#D9B98A" opacity={0.3} />
        <Circle cx={c - r * 0.05} cy={c + r * 0.38} r={r * 0.12} fill="#D9B98A" opacity={0.28} />
        <Circle cx={c + r * 0.4} cy={c - r * 0.38} r={r * 0.07} fill="#D9B98A" opacity={0.3} />
        <AnimatedPath animatedProps={shadowProps} fill={pale ? '#C9A9B8' : '#151A3F'} opacity={pale ? 0.5 : 0.94} />
      </Svg>
    </View>
  );
}
