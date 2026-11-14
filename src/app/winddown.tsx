import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BigDuration } from '@/components/BigDuration';
import { IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { HoldButton } from '@/components/HoldButton';
import { BackIcon, CheckIcon } from '@/components/Icons';
import { Moon } from '@/components/Moon';
import { SkyBackground } from '@/components/SkyBackground';
import { useT } from '@/i18n';
import { factOfDay } from '@/lib/facts';
import { haptic } from '@/lib/haptics';
import { minutesUntil } from '@/lib/time';
import { useDayPhase, useNow } from '@/lib/useNow';
import { useApp } from '@/store/useApp';
import { night, space } from '@/theme';

// Отход ко сну: тёмный, тёплый экран, одно действие за раз (research.md, разделы 1 и 5).
const DIM = 'rgba(243,233,220,0.82)';

export default function WindDown() {
  const { t } = useT();
  const now = useNow();
  const phase = useDayPhase(now);
  const { bed, moonPhase, goals, markBed } = useApp();
  const [done, setDone] = useState(0);
  const until = minutesUntil(now, bed);
  const late = phase === 'bedtime' || until > 180;
  const steps = t.windDown.steps;

  return (
    <SkyBackground mode="deep">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton label={t.common.back} onPress={() => router.back()}>
            <BackIcon color="rgba(165,168,240,0.6)" />
          </IconButton>
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(1200)} style={{ alignItems: 'center', marginTop: -30, marginBottom: -18 }}>
            <Moon phase={moonPhase} size={96} />
          </Animated.View>
          <AppText variant="label" align="center" color="rgba(165,168,240,0.6)">
            {t.windDown.title}
          </AppText>
          <View style={{ marginTop: space.sm, marginBottom: space.xl, alignItems: 'center' }}>
            {late ? (
              <AppText variant="title" align="center" color={DIM}>
                {t.windDown.late}
              </AppText>
            ) : (
              <>
                <BigDuration minutes={until} color={DIM} size={60} />
                <AppText variant="caption" align="center" color="rgba(165,168,240,0.6)">
                  {t.windDown.left}
                </AppText>
              </>
            )}
          </View>

          <View style={{ gap: space.sm }}>
            {steps.map((s, i) => {
              const isDone = i < done;
              const isCurrent = i === done;
              if (i > done) return null;
              return (
                <Animated.View key={i} entering={FadeInDown.duration(500)} layout={LinearTransition.duration(300)}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    disabled={!isCurrent}
                    onPress={() => {
                      haptic.light();
                      setDone(i + 1);
                    }}
                  >
                    <Glass style={{ opacity: isDone ? 0.55 : 1 }}>
                      <View style={styles.step}>
                        <View style={[styles.box, isDone && styles.boxDone]}>{isDone && <CheckIcon size={14} />}</View>
                        <AppText style={{ flex: 1, fontSize: 17, lineHeight: 24 }} color={DIM}>
                          {s}
                        </AppText>
                      </View>
                    </Glass>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {done >= steps.length && (
            <Animated.View entering={FadeIn.duration(600)} style={{ marginTop: space.lg }}>
              <AppText variant="caption" align="center" color="rgba(165,168,240,0.65)">
                ✦ {factOfDay(goals, now, t)}
              </AppText>
            </Animated.View>
          )}
        </View>

        <View style={styles.footer}>
          <HoldButton
            label={t.windDown.hold}
            onDone={() => {
              markBed();
              router.replace('/night');
            }}
          />
        </View>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingTop: space.sm },
  body: { flex: 1, paddingHorizontal: space.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,184,107,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: night.accentDeep, borderColor: night.accentDeep },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
});
