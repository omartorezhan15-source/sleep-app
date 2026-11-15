import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useSvgId } from '@/lib/useSvgId';

const ACircle = Animated.createAnimatedComponent(Circle);

type Props = { progress: number; size?: number; stroke?: number; children?: ReactNode };

/** Кольцо прогресса в палитре рассвета (задание «30 шагов»). */
export function ProgressRing({ progress, size = 240, stroke = 18, children }: Props) {
  const id = useSvgId('ring');
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(Math.min(1, Math.max(0, progress)), { damping: 20, stiffness: 90 });
  }, [progress, p]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F6C453" />
            <Stop offset="1" stopColor="#FF9F7A" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.45)" strokeWidth={stroke} fill="none" />
        <ACircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len} ${len}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}
