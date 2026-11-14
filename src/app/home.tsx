import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BigDuration } from '@/components/BigDuration';
import { IconButton, PillButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { ChartIcon, MoonGlyph, SlidersIcon, SunGlyph } from '@/components/Icons';
import { Moon } from '@/components/Moon';
import { SkyBackground } from '@/components/SkyBackground';
import { formatDuration, useT } from '@/i18n';
import { factOfDay } from '@/lib/facts';
import { formatClock, minutesUntil, sleepDuration } from '@/lib/time';
import { isDawnTime, useDayPhase, useNow } from '@/lib/useNow';
import { MOON_MAX, useApp } from '@/store/useApp';
import { dawn, fonts, night, space } from '@/theme';

export default function Home() {
  const { t, f } = useT();
  const now = useNow();
  const phase = useDayPhase(now);
  const { bed, wake, moonPhase, plan, goals } = useApp();

  useEffect(() => {
    if (phase === 'inBed') router.replace('/night');
    if (phase === 'morning') router.replace('/morning');
  }, [phase]);

  const dawnMode = phase === 'day' && isDawnTime(now, wake);
  const tone = dawnMode ? 'dawn' : 'night';
  const pal = dawnMode ? dawn : night;
  const until = minutesUntil(now, bed);
  const isBedtime = phase === 'bedtime';

  return (
    <SkyBackground mode={dawnMode ? 'dawn' : 'night'}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(900)} style={styles.moonWrap}>
            <Moon phase={moonPhase} size={176} tone={dawnMode ? 'pale' : 'night'} />
          </Animated.View>
          <AppText variant="label" align="center" color={pal.textSecondary} style={styles.phase}>
            {moonPhase >= MOON_MAX ? t.moon.full : f(t.moon.phase, { n: moonPhase })}
          </AppText>

          <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.hero}>
            {isBedtime ? (
              <>
                <AppText variant="title" align="center" color={pal.text} style={{ fontSize: 34, lineHeight: 42 }}>
                  {t.home.bedNow}
                </AppText>
                <AppText variant="caption" align="center" color={pal.textSecondary} style={{ marginTop: 6 }}>
                  {t.home.bedNowSub}
                </AppText>
              </>
            ) : (
              <>
                <BigDuration minutes={until} color={pal.text} />
                <AppText variant="caption" align="center" color={pal.textSecondary}>
                  {f(t.home.untilBed, { time: formatClock(bed) })}
                </AppText>
              </>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.cards}>
            <Glass tone={tone} padded={false}>
              <View style={styles.scheduleRow}>
                <View style={styles.timeCol}>
                  <MoonGlyph color={pal.accent} />
                  <AppText style={styles.time} color={pal.text}>
                    {formatClock(bed)}
                  </AppText>
                </View>
                <View style={[styles.line, { backgroundColor: pal.glassBorder }]} />
                <AppText variant="caption" color={pal.textSecondary}>
                  {formatDuration(sleepDuration(bed, wake), t)}
                </AppText>
                <View style={[styles.line, { backgroundColor: pal.glassBorder }]} />
                <View style={styles.timeCol}>
                  <SunGlyph color={dawnMode ? '#E0A12E' : '#FFD27A'} />
                  <AppText style={styles.time} color={pal.text}>
                    {formatClock(wake)}
                  </AppText>
                </View>
              </View>
            </Glass>

            {!!plan && (
              <Glass tone={tone}>
                <AppText variant="label" color={pal.textSecondary}>
                  {t.home.plan}
                </AppText>
                <AppText style={{ marginTop: 8 }} color={pal.text}>
                  {plan}
                </AppText>
              </Glass>
            )}

            <Glass tone={tone}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <AppText style={{ fontSize: 18, color: pal.accent }}>✦</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" color={pal.textSecondary}>
                    {t.home.factLabel}
                  </AppText>
                  <AppText style={{ marginTop: 6 }} color={pal.text}>
                    {factOfDay(goals, now, t, dawnMode ? 'morning' : 'evening')}
                  </AppText>
                </View>
              </View>
            </Glass>
          </Animated.View>
        </ScrollView>

        <View style={styles.topBar} pointerEvents="box-none">
          <IconButton label={t.stats.title} onPress={() => router.push('/stats')}>
            <ChartIcon color={pal.secondary} />
          </IconButton>
          <IconButton label={t.settings.title} onPress={() => router.push('/settings')}>
            <SlidersIcon color={pal.secondary} />
          </IconButton>
        </View>

        <LinearGradient
          pointerEvents="none"
          colors={dawnMode ? ['rgba(255,179,193,0)', dawn.bgBottom] : ['rgba(27,31,75,0)', night.bgBottom]}
          style={styles.fade}
        />
        {(isBedtime || until <= 180) && (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <PillButton
              tone={tone}
              label={isBedtime ? t.home.goToBed : t.home.startWindDown}
              onPress={() => router.push('/winddown')}
            />
          </SafeAreaView>
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.sm },
  scroll: { paddingHorizontal: space.lg, paddingTop: 40, paddingBottom: 140 },
  moonWrap: { alignItems: 'center', marginBottom: -56 },
  phase: { marginBottom: space.md },
  hero: { alignItems: 'center', marginBottom: space.xl },
  cards: { gap: space.sm },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 18, gap: 10 },
  timeCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { fontFamily: fonts.semibold, fontSize: 22, fontVariant: ['tabular-nums'] },
  line: { flex: 1, height: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
  footer: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.md },
});
