import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgeStepper } from '@/components/AgeStepper';
import { AppText } from '@/components/AppText';
import { IconButton, PillButton } from '@/components/Buttons';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { BackIcon, BoltIcon, BookIcon, CheckIcon, PulseIcon, SproutIcon } from '@/components/Icons';
import { Moon } from '@/components/Moon';
import { SkyBackground } from '@/components/SkyBackground';
import { SleepDial } from '@/components/SleepDial';
import { fill, formatRange, getDict, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { requestReminderPermission, scheduleReminders } from '@/lib/notifications';
import { sleepGoalForAge } from '@/lib/sleepGoal';
import { formatClock } from '@/lib/time';
import { useApp, type Goal, type Obstacle } from '@/store/useApp';
import { fonts, night, radius, space } from '@/theme';

const GOALS: { key: Goal; Icon: typeof BoltIcon }[] = [
  { key: 'energy', Icon: BoltIcon },
  { key: 'growth', Icon: SproutIcon },
  { key: 'study', Icon: BookIcon },
  { key: 'sport', Icon: PulseIcon },
];
const OBSTACLES: Obstacle[] = ['video', 'games', 'chat', 'study', 'thoughts'];
const STEPS = 4;
const canNotify = Platform.OS !== 'web';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const { t } = useT();

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <SkyBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={{ width: 44 }}>
            {step > 0 && (
              <IconButton label={t.common.back} onPress={back}>
                <BackIcon />
              </IconButton>
            )}
          </View>
          <View style={styles.dots}>
            {Array.from({ length: STEPS }, (_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
            ))}
          </View>
          <View style={{ width: 44, alignItems: 'flex-end' }}>{step === 0 && <LangToggle />}</View>
        </View>

        <Animated.View
          key={step}
          entering={FadeInRight.duration(450)}
          exiting={FadeOutLeft.duration(250)}
          style={{ flex: 1 }}
        >
          {step === 0 && <Welcome onNext={next} />}
          {step === 1 && <Goals onNext={next} />}
          {step === 2 && <AgeAndTime onNext={next} />}
          {step === 3 && <Plan />}
        </Animated.View>
      </SafeAreaView>
    </SkyBackground>
  );
}

function LangToggle() {
  const locale = useApp((s) => s.locale);
  const set = useApp((s) => s.set);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Language"
      onPress={() => {
        haptic.tick();
        set({ locale: locale === 'ru' ? 'en' : 'ru' });
      }}
      style={styles.lang}
    >
      <AppText style={{ fontFamily: fonts.semibold, fontSize: 13 }} color={night.secondary}>
        {locale === 'ru' ? 'EN' : 'RU'}
      </AppText>
    </Pressable>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  const { t } = useT();
  const rise = useSharedValue(0);
  useEffect(() => {
    rise.value = withDelay(200, withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }));
  }, [rise]);
  const moonStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: (1 - rise.value) * 140 }],
  }));

  return (
    <View style={styles.page}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={moonStyle}>
          <Moon phase={4} size={150} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(900).duration(800)} style={{ marginTop: -24 }}>
          <AppText variant="title" align="center" style={{ fontSize: 34, lineHeight: 42 }}>
            {t.onboarding.welcomeTitle}
          </AppText>
          <AppText variant="caption" align="center" style={{ marginTop: space.md, paddingHorizontal: space.sm }}>
            {t.onboarding.welcomeText}
          </AppText>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(1500).duration(600)}>
        <PillButton label={t.common.start} onPress={onNext} />
      </Animated.View>
    </View>
  );
}

function Goals({ onNext }: { onNext: () => void }) {
  const { t } = useT();
  const goals = useApp((s) => s.goals);
  const set = useApp((s) => s.set);

  const toggle = (g: Goal) => {
    if (goals.includes(g)) set({ goals: goals.filter((x) => x !== g) });
    else set({ goals: [...goals, g].slice(-2) });
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.lg }} showsVerticalScrollIndicator={false}>
        <AppText variant="title">{t.onboarding.goalsTitle}</AppText>
        <AppText variant="caption" style={{ marginTop: 6, marginBottom: space.lg }}>
          {t.onboarding.goalsHint}
        </AppText>
        <View style={{ gap: space.sm }}>
          {GOALS.map(({ key, Icon }, i) => {
            const selected = goals.includes(key);
            return (
              <Animated.View key={key} entering={FadeInDown.delay(80 * i).duration(500)}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    haptic.tick();
                    toggle(key);
                  }}
                >
                  <Glass style={selected ? styles.goalSelected : undefined} padded={false}>
                    <View style={styles.goalRow}>
                      <View style={[styles.goalIcon, selected && { backgroundColor: 'rgba(255,184,107,0.18)' }]}>
                        <Icon color={selected ? night.accent : night.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="heading" style={{ fontSize: 18 }}>
                          {t.goals[key].title}
                        </AppText>
                        {selected && (
                          <Animated.View entering={FadeIn.duration(400)}>
                            <AppText variant="caption" style={{ marginTop: 2, fontSize: 14, lineHeight: 19 }}>
                              {t.goals[key].note}
                            </AppText>
                          </Animated.View>
                        )}
                      </View>
                      <View style={[styles.check, selected && styles.checkOn]}>
                        {selected && <CheckIcon size={14} />}
                      </View>
                    </View>
                  </Glass>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
      <PillButton label={t.common.next} onPress={onNext} disabled={goals.length === 0} />
    </View>
  );
}

function AgeAndTime({ onNext }: { onNext: () => void }) {
  const { t, f } = useT();
  const { age, bed, wake, set } = useApp();
  const goal = sleepGoalForAge(age);
  const { height } = useWindowDimensions();
  const dialSize = Math.min(268, Math.max(200, height - 560));

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: space.md }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <AppText variant="title" align="center">
          {t.onboarding.ageTitle}
        </AppText>
        <View style={{ marginTop: space.sm }}>
          <AgeStepper value={age} onChange={(v) => set({ age: v })} />
        </View>
        <AppText variant="caption" align="center" color={night.accent}>
          {f(t.onboarding.ageNeed, { range: formatRange(goal.min, goal.max, t) })}
        </AppText>

        <AppText variant="heading" align="center" style={{ marginTop: space.md }}>
          {t.onboarding.timeTitle}
        </AppText>
        <AppText variant="caption" align="center" style={{ marginBottom: space.sm }}>
          {t.onboarding.timeHint}
        </AppText>
        <SleepDial bed={bed} wake={wake} goal={goal} size={dialSize} onChange={(b, w) => set({ bed: b, wake: w })} />
      </ScrollView>
      <PillButton label={t.common.next} onPress={onNext} />
    </View>
  );
}

function Plan() {
  const { t } = useT();
  const { obstacle, plan, bed, locale, set, completeOnboarding } = useApp();
  const [busy, setBusy] = useState(false);
  const cueTime = formatClock(bed - 15);

  const choose = (o: Obstacle) => {
    set({ obstacle: o, plan: fill(t.planTemplates[o], { time: cueTime }) });
  };

  const finish = async (withReminders: boolean) => {
    setBusy(true);
    let granted = false;
    if (withReminders) {
      granted = await requestReminderPermission().catch(() => false);
      if (granted) {
        const s = useApp.getState();
        await scheduleReminders(s.bed, s.wake, getDict(locale)).catch(() => {});
      }
    }
    set({ remindersOn: granted });
    completeOnboarding();
    haptic.success();
    router.replace('/home');
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: space.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">{t.onboarding.planTitle}</AppText>
        <AppText variant="caption" style={{ marginTop: 6, marginBottom: space.lg }}>
          {t.onboarding.planHint}
        </AppText>
        <View style={styles.chips}>
          {OBSTACLES.map((o) => (
            <Chip key={o} label={t.obstacles[o]} selected={obstacle === o} onPress={() => choose(o)} />
          ))}
        </View>

        {!!obstacle && (
          <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: space.lg }}>
            <Glass>
              <AppText variant="label">{t.onboarding.planLabel}</AppText>
              <TextInput
                value={plan}
                onChangeText={(v) => set({ plan: v })}
                multiline
                style={styles.planInput}
                selectionColor={night.accent}
                placeholderTextColor={night.textMuted}
              />
            </Glass>
          </Animated.View>
        )}
      </ScrollView>
      <View style={{ gap: space.xs }}>
        {!!obstacle && canNotify && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.notify}>
            <AppText variant="caption" align="center" style={{ fontSize: 14, lineHeight: 19 }}>
              {t.onboarding.notifyText}
            </AppText>
          </Animated.View>
        )}
        {canNotify ? (
          <>
            <PillButton label={t.onboarding.notifyAllow} onPress={() => finish(true)} disabled={!obstacle || busy} />
            <PillButton
              kind="ghost"
              label={t.onboarding.notifySkip}
              onPress={() => finish(false)}
              disabled={!obstacle || busy}
            />
          </>
        ) : (
          // В браузере уведомлений по расписанию нет — просто завершаем.
          <PillButton label={t.common.done} onPress={() => finish(false)} disabled={!obstacle || busy} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    height: 56,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(165,168,240,0.25)' },
  dotActive: { width: 24, backgroundColor: night.accent },
  dotDone: { backgroundColor: 'rgba(255,184,107,0.5)' },
  lang: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: night.glass,
    borderWidth: 1,
    borderColor: night.glassBorder,
  },
  page: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(165,168,240,0.10)',
  },
  goalSelected: { borderColor: 'rgba(255,184,107,0.6)' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(165,168,240,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: night.accent, borderColor: night.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planInput: {
    marginTop: 8,
    color: night.text,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 72,
    textAlignVertical: 'top',
    padding: 0,
  },
  notify: { paddingHorizontal: space.md, marginBottom: space.xs },
});
