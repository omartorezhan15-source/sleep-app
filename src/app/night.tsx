import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Moon } from '@/components/Moon';
import { SkyBackground } from '@/components/SkyBackground';
import { fill, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { formatClock } from '@/lib/time';
import { useDayPhase, useNow } from '@/lib/useNow';
import { blocking } from '@/native/blocking';
import { useApp } from '@/store/useApp';
import { fonts, space } from '@/theme';

// Ночной экран: почти чёрный, ничего не мигает, минимум света.
export default function Night() {
  const { t } = useT();
  const now = useNow(30_000);
  const phase = useDayPhase(now);
  const { wake, moonPhase, undoBed, blockingEnabled } = useApp();

  useEffect(() => {
    if (phase === 'morning') router.replace('/morning');
    if (phase === 'day' || phase === 'windDown' || phase === 'bedtime') router.replace('/home');
  }, [phase]);

  return (
    <SkyBackground mode="deep">
      <SafeAreaView style={styles.root}>
        <Animated.View entering={FadeIn.duration(2000)} style={styles.center}>
          <View style={{ opacity: 0.75 }}>
            <Moon phase={moonPhase} size={120} />
          </View>
          <AppText variant="heading" align="center" color="rgba(243,233,220,0.7)" style={{ marginTop: -24 }}>
            {t.night.goodNight}
          </AppText>
          <AppText align="center" color="rgba(165,168,240,0.5)" style={styles.wake}>
            {fill(t.night.wakeAt, { time: formatClock(wake) })}
          </AppText>
          {blockingEnabled && blocking.isAvailable() && (
            <AppText align="center" color="rgba(165,168,240,0.4)" style={{ marginTop: 10, fontSize: 14 }}>
              {t.night.phoneAsleep}
            </AppText>
          )}
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          hitSlop={16}
          onPress={() => {
            haptic.tick();
            undoBed();
            router.replace('/home');
          }}
          style={styles.notYet}
        >
          <AppText align="center" color="rgba(165,168,240,0.4)" style={{ fontSize: 14 }}>
            {t.night.notYet}
          </AppText>
        </Pressable>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wake: { marginTop: 6, fontFamily: fonts.light, fontSize: 18, fontVariant: ['tabular-nums'] },
  notYet: { alignSelf: 'center', padding: space.md, marginBottom: space.sm },
});
