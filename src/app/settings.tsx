import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/Buttons';
import { Chip } from '@/components/Chip';
import { Glass } from '@/components/Glass';
import { BackIcon, BellIcon, CallIcon, PhoneSleepIcon } from '@/components/Icons';
import { NightTimeline } from '@/components/NightTimeline';
import { SkyBackground } from '@/components/SkyBackground';
import { TaskPicker } from '@/components/TaskPicker';
import { MAX_AGE, MIN_AGE } from '@/components/AgeStepper';
import { fill, formatRange, getDict, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { cancelReminders, requestReminderPermission, scheduleReminders } from '@/lib/notifications';
import { sleepGoalForAge } from '@/lib/sleepGoal';
import { formatClock } from '@/lib/time';
import { alarm } from '@/native/alarm';
import { blocking } from '@/native/blocking';
import { enableAlarm, enableBlocking, nativeAvailable } from '@/native/nightPlan';
import { useApp, type Goal } from '@/store/useApp';
import { fonts, night, radius, space } from '@/theme';

const GOALS: Goal[] = ['energy', 'growth', 'study', 'sport'];

export default function Settings() {
  const { t } = useT();
  const app = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const goal = sleepGoalForAge(app.age);

  const setLocale = async (locale: 'ru' | 'en') => {
    haptic.tick();
    // Если план — наш неизменённый шаблон, переводим его вместе с языком.
    let plan = app.plan;
    if (app.obstacle) {
      const time = formatClock(app.bed - 15);
      if (plan === fill(getDict(app.locale).planTemplates[app.obstacle], { time })) {
        plan = fill(getDict(locale).planTemplates[app.obstacle], { time });
      }
    }
    app.set({ locale, plan });
    if (app.remindersOn) await scheduleReminders(app.bed, app.wake, getDict(locale)).catch(() => {});
  };

  const toggleReminders = async (on: boolean) => {
    if (on) {
      const granted = await requestReminderPermission().catch(() => false);
      if (granted) await scheduleReminders(app.bed, app.wake, t).catch(() => {});
      app.set({ remindersOn: granted });
    } else {
      await cancelReminders().catch(() => {});
      app.set({ remindersOn: false });
    }
  };

  const toggleGoal = (g: Goal) => {
    const goals = app.goals.includes(g) ? app.goals.filter((x) => x !== g) : [...app.goals, g].slice(-2);
    app.set({ goals });
  };

  return (
    <SkyBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton label={t.common.back} onPress={() => router.back()}>
            <BackIcon />
          </IconButton>
          <AppText variant="heading">{t.settings.title}</AppText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Section title={t.settings.language}>
            <View style={styles.segment}>
              {(['ru', 'en'] as const).map((l) => (
                <Pressable
                  key={l}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: app.locale === l }}
                  onPress={() => setLocale(l)}
                  style={[styles.segBtn, app.locale === l && styles.segOn]}
                >
                  <AppText
                    style={{ fontFamily: fonts.semibold }}
                    color={app.locale === l ? night.onAccent : night.secondary}
                  >
                    {l === 'ru' ? 'Русский' : 'English'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title={t.settings.schedule}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/schedule')}>
              <Glass>
                <View style={styles.row}>
                  <AppText style={styles.big}>
                    {formatClock(app.bed)} → {formatClock(app.wake)}
                  </AppText>
                  <AppText color={night.secondary} style={{ fontSize: 22 }}>
                    ›
                  </AppText>
                </View>
              </Glass>
            </Pressable>
          </Section>

          <Section title={t.settings.age}>
            <Glass>
              <View style={styles.row}>
                <View>
                  <AppText style={styles.big}>{app.age}</AppText>
                  <AppText variant="caption" style={{ fontSize: 13 }}>
                    {formatRange(goal.min, goal.max, t)}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SmallBtn label="−" onPress={() => app.set({ age: Math.max(MIN_AGE, app.age - 1) })} />
                  <SmallBtn label="+" onPress={() => app.set({ age: Math.min(MAX_AGE, app.age + 1) })} />
                </View>
              </View>
            </Glass>
          </Section>

          <Section title={t.settings.goals}>
            <View style={styles.chips}>
              {GOALS.map((g) => (
                <Chip key={g} label={t.goals[g].title} selected={app.goals.includes(g)} onPress={() => toggleGoal(g)} />
              ))}
            </View>
          </Section>

          <Section title={t.task.choose}>
            <TaskPicker value={app.taskType} onChange={(taskType) => app.set({ taskType })} />
          </Section>

          <Section title={t.settings.plan}>
            <Glass>
              <TextInput
                value={app.plan}
                onChangeText={(v) => app.set({ plan: v })}
                multiline
                style={styles.input}
                selectionColor={night.accent}
              />
            </Glass>
          </Section>

          {Platform.OS !== 'web' && (
            <Glass>
              <View style={styles.row}>
                <AppText style={{ flex: 1, fontSize: 17 }}>{t.settings.reminders}</AppText>
                <Switch
                  value={app.remindersOn}
                  onValueChange={toggleReminders}
                  trackColor={{ true: night.accent, false: 'rgba(165,168,240,0.25)' }}
                  thumbColor={night.text}
                  {...({ activeThumbColor: night.text } as object)}
                />
              </View>
            </Glass>
          )}

          <Section title={t.blocking.section}>
            <BlockingSettings />
          </Section>

          <Section title={t.settings.science}>
            <Glass>
              <AppText variant="caption">{t.settings.scienceText}</AppText>
            </Glass>
          </Section>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (!confirmReset) {
                haptic.light();
                setConfirmReset(true);
                return;
              }
              cancelReminders().catch(() => {});
              app.reset();
              router.replace('/onboarding');
            }}
            style={styles.reset}
          >
            <AppText
              align="center"
              color={confirmReset ? night.accent : 'rgba(165,168,240,0.5)'}
              style={{ fontSize: 15 }}
            >
              {confirmReset ? t.settings.resetConfirm : t.settings.reset}
            </AppText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

// Блокировка и будильник (этап 2, DESIGN_BRIEF.md, раздел 2).
function BlockingSettings() {
  const { t } = useT();
  const app = useApp();
  const [msg, setMsg] = useState<string | null>(null);
  const native = nativeAvailable();
  const on = native && app.blockingEnabled;

  const row = (
    icon: ReactNode,
    label: string,
    enabled: boolean,
    onEnable: () => Promise<string>,
    disabledReason?: string,
  ) => (
    <View style={[styles.row, styles.featureRow]}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontSize: 16 }}>{label}</AppText>
        <AppText variant="caption" style={{ fontSize: 13 }} color={enabled ? night.accent : undefined}>
          {disabledReason ?? (enabled ? t.blocking.on : t.blocking.off)}
        </AppText>
      </View>
      {!enabled && !disabledReason && (
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            haptic.tick();
            const res = await onEnable();
            setMsg(res === 'approved' || res === 'authorized' ? null : t.blocking.denied);
          }}
          style={styles.enable}
        >
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 15 }} color={night.onAccent}>
            {t.blocking.enable}
          </AppText>
        </Pressable>
      )}
    </View>
  );

  return (
    <Glass>
      <View style={styles.status}>
        <View style={[styles.statusDot, { backgroundColor: on ? '#8FE0B0' : night.secondary }]} />
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }} color={on ? night.text : night.secondary}>
          {!native ? t.blocking.statusWeb : on ? t.blocking.statusOn : t.blocking.statusOff}
        </AppText>
      </View>

      <NightTimeline bed={app.bed} wake={app.wake} />

      <View style={styles.always}>
        <CallIcon />
        <View style={{ flex: 1 }}>
          <AppText variant="label" style={{ fontSize: 11 }}>
            {t.blocking.always}
          </AppText>
          <AppText style={{ fontSize: 15, marginTop: 2 }}>{t.blocking.alwaysList}</AppText>
        </View>
      </View>
      <AppText variant="caption" style={{ fontSize: 13, lineHeight: 18, marginTop: space.sm }}>
        {t.blocking.noSnooze}
      </AppText>

      {native && (
        <>
          {row(
            <PhoneSleepIcon size={20} />,
            t.blocking.blockingRow,
            app.blockingEnabled,
            enableBlocking,
            blocking.isAvailable() ? undefined : t.blocking.onlyIphone,
          )}
          {row(
            <BellIcon size={20} />,
            t.blocking.alarmRow,
            app.alarmEnabled,
            enableAlarm,
            alarm.isAvailable() ? undefined : t.blocking.alarmUnsupported,
          )}
        </>
      )}
      {msg && (
        <AppText variant="caption" style={{ marginTop: space.sm }} color={night.accent}>
          {msg}
        </AppText>
      )}
    </Glass>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <AppText variant="label" style={{ marginLeft: 6 }}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function SmallBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.tick();
        onPress();
      }}
      style={styles.small}
    >
      <AppText color={night.secondary} style={{ fontSize: 22, lineHeight: 26 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: night.glass,
    borderWidth: 1,
    borderColor: night.glassBorder,
  },
  segBtn: { flex: 1, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: night.accent },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  big: { fontFamily: fonts.light, fontSize: 26, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: {
    color: night.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 96,
    padding: 0,
    textAlignVertical: 'top',
  },
  small: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: night.glass,
    borderWidth: 1,
    borderColor: night.glassBorder,
  },
  reset: { padding: space.md },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space.md },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  always: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: night.glassBorder,
  },
  featureRow: { marginTop: space.md, gap: 12 },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,184,107,0.14)',
  },
  enable: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: night.accent,
  },
});
