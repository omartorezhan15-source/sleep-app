import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PillButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { Moon } from '@/components/Moon';
import { SkyBackground, type SkyMode } from '@/components/SkyBackground';
import { Sun } from '@/components/Sun';
import { TaskBadge } from '@/components/TaskPicker';
import { fill, formatDuration, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { AUTO_UNLOCK_MIN, blockingStatus } from '@/lib/blocking';
import { formatClock, nightKey } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useApp } from '@/store/useApp';
import { dawn, fonts, space } from '@/theme';

export default function Morning() {
  const { t } = useT();
  const { nights, moonPhase, markWake, wake, bed, taskType } = useApp();
  const [now] = useState(() => new Date());
  const live = useNow();
  const rec = nights[nightKey(now)];
  // Этап 2: сначала утреннее задание (оно снимает блокировку), через 60 минут после подъёма — снимается само.
  const blocking = blockingStatus(live, bed, wake, rec);
  const needTask = !rec?.taskDoneAt && blocking.phase !== 'unlockedAuto';
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
          <View style={styles.sun}>
            <Sun size={250} />
          </View>
          <Animated.View entering={FadeInDown.delay(900).duration(800)}>
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
            {rec?.blockingRevoked && (
              <Glass tone="dawn">
                <AppText color={dawn.text}>{t.morning.revoked}</AppText>
              </Glass>
            )}
            {blocking.phase === 'unlockedAuto' && !rec?.taskDoneAt && (
              <Glass tone="dawn">
                <AppText color={dawn.text}>{t.morning.unlockedAuto}</AppText>
              </Glass>
            )}
            <Glass tone="dawn">
              <AppText color={dawn.text}>☀︎ {t.morning.light}</AppText>
            </Glass>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(1800).duration(600)} style={styles.footer}>
          {needTask ? (
            <>
              <Glass tone="dawn" padded={false} style={{ marginBottom: space.sm }}>
                <View style={styles.taskCard}>
                  <TaskBadge type={taskType} tone="dawn" />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" color={dawn.textSecondary} style={{ fontSize: 11 }}>
                      {t.morning.taskCard}
                    </AppText>
                    <AppText color={dawn.text} style={{ fontSize: 18 }}>
                      {t.task.names[taskType]}
                    </AppText>
                    {Platform.OS !== 'web' && (
                      <AppText variant="caption" color={dawn.textSecondary} style={{ fontSize: 13, lineHeight: 18 }}>
                        {fill(t.morning.taskFirst, { time: formatClock(wake + AUTO_UNLOCK_MIN) })}
                      </AppText>
                    )}
                  </View>
                </View>
              </Glass>
              <PillButton tone="dawn" label={t.task.start} onPress={() => router.push('/task')} />
            </>
          ) : (
            <PillButton
              tone="dawn"
              label={t.morning.up}
              onPress={() => {
                markWake();
                router.replace('/home');
              }}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: space.lg },
  sun: { alignItems: 'center', marginTop: -6, marginBottom: -34 },
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  slept: { marginTop: 4, fontFamily: fonts.light, fontSize: 20 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 18 },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
});
