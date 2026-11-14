import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton, PillButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { BackIcon } from '@/components/Icons';
import { SkyBackground } from '@/components/SkyBackground';
import { SleepDial } from '@/components/SleepDial';
import { fill, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { scheduleReminders } from '@/lib/notifications';
import { sleepGoalForAge } from '@/lib/sleepGoal';
import { formatClock } from '@/lib/time';
import { useApp } from '@/store/useApp';
import { space } from '@/theme';

export default function Schedule() {
  const { t } = useT();
  const app = useApp();
  const [bed, setBed] = useState(app.bed);
  const [wake, setWake] = useState(app.wake);

  const save = async () => {
    // Неизменённый шаблон плана «если… то…» подстраиваем под новое время сна.
    let plan = app.plan;
    if (app.obstacle && plan === fill(t.planTemplates[app.obstacle], { time: formatClock(app.bed - 15) })) {
      plan = fill(t.planTemplates[app.obstacle], { time: formatClock(bed - 15) });
    }
    app.set({ bed, wake, plan });
    if (app.remindersOn) await scheduleReminders(bed, wake, t).catch(() => {});
    haptic.success();
    router.back();
  };

  return (
    <SkyBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton label={t.common.back} onPress={() => router.back()}>
            <BackIcon />
          </IconButton>
          <AppText variant="heading">{t.schedule.title}</AppText>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.body}>
          <SleepDial
            bed={bed}
            wake={wake}
            goal={sleepGoalForAge(app.age)}
            size={320}
            onChange={(b, w) => {
              setBed(b);
              setWake(w);
            }}
          />
          <Glass style={{ marginTop: space.lg }}>
            <AppText variant="caption">{t.schedule.sameEveryDay}</AppText>
          </Glass>
        </View>
        <View style={styles.footer}>
          <PillButton label={t.common.save} onPress={save} />
        </View>
      </SafeAreaView>
    </SkyBackground>
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
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: space.lg },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
});
