import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { PillButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Moon } from '@/components/Moon';
import { SkyBackground, type SkyMode } from '@/components/SkyBackground';
import { fill, formatDuration, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { nightKey } from '@/lib/time';
import { useApp } from '@/store/useApp';
import { dawn, fonts, space } from '@/theme';

function Sun() {
  const rise = useSharedValue(0);
  useEffect(() => {
    rise.value = withDelay(400, withTiming(1, { duration: 2600, easing: Easing.out(Easing.cubic) }));
  }, [rise]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - rise.value) * 160 }], opacity: rise.value }));
  return (
    <Animated.View style={[{ alignItems: 'center' }, style]}>
      <Svg width={220} height={220}>
        <Defs>
          <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFF3C4" />
            <Stop offset="0.32" stopColor="#FFD66B" />
            <Stop offset="0.36" stopColor="#FFC85A" stopOpacity={0.45} />
            <Stop offset="1" stopColor="#FFB86B" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={110} cy={110} r={110} fill="url(#sun)" />
      </Svg>
    </Animated.View>
  );
}

export default function Morning() {
  const { t } = useT();
  const { nights, moonPhase, markWake } = useApp();
  const [now] = useState(() => new Date());
  const rec = nights[nightKey(now)];
  const onTime = !!rec?.onTime;
  const slept = rec?.bedAt ? Math.max(0, (now.getTime() - rec.bedAt) / 60_000) : null;

  // Ночь → рассвет: фон плавно переливается после открытия экрана.
  const [mode, setMode] = useState<SkyMode>('night');
  const [shownPhase, setShownPhase] = useState(onTime ? Math.max(1, moonPhase - 1) : Math.min(14, moonPhase + 1));
  useEffect(() => {
    const a = setTimeout(() => setMode('dawn'), 150);
    const b = setTimeout(() => {
      setShownPhase(moonPhase);
      if (onTime) haptic.success();
    }, 1800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [moonPhase, onTime]);

  return (
    <SkyBackground mode={mode}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.body}>
          <Sun />
          <Animated.View entering={FadeInDown.delay(900).duration(800)} style={{ marginTop: -70 }}>
            <AppText variant="title" align="center" color={dawn.text} style={{ fontSize: 36, lineHeight: 44 }}>
              {t.morning.hello}
            </AppText>
            {slept !== null && (
              <AppText align="center" color={dawn.textSecondary} style={styles.slept}>
                {fill(t.morning.slept, { duration: formatDuration(Math.round(slept / 5) * 5, t) })}
              </AppText>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1300).duration(800)} style={{ gap: space.sm, marginTop: space.lg }}>
            <Glass tone="dawn" padded={false}>
              <View style={styles.result}>
                <View style={{ marginVertical: -38, marginLeft: -22, marginRight: -18 }}>
                  <Moon phase={shownPhase} size={64} tone="pale" glow={false} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="heading" color={dawn.text}>
                    {onTime ? t.morning.counted : t.morning.late}
                  </AppText>
                  <AppText variant="caption" color={dawn.textSecondary}>
                    {onTime ? `${t.morning.countedSub} · ${moonPhase}/14` : t.morning.lateSub}
                  </AppText>
                </View>
              </View>
            </Glass>
            <Glass tone="dawn">
              <AppText color={dawn.text}>☀︎ {t.morning.light}</AppText>
            </Glass>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(1800).duration(600)} style={styles.footer}>
          <PillButton
            tone="dawn"
            label={t.morning.up}
            onPress={() => {
              markWake();
              router.replace('/home');
            }}
          />
        </Animated.View>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: space.lg, justifyContent: 'center' },
  slept: { marginTop: 4, fontFamily: fonts.light, fontSize: 20 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 18 },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
});
