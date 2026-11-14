import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { BackIcon } from '@/components/Icons';
import { SkyBackground } from '@/components/SkyBackground';
import { SleepChart, tsToMinutes, type ChartNight } from '@/components/SleepChart';
import { formatDuration, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { useScreen } from '@/lib/useScreen';
import { addDaysKey, eveningMinutes, keyToDate, nightKey } from '@/lib/time';
import { useApp } from '@/store/useApp';
import { fonts, night, radius, space } from '@/theme';

type Range = 'week' | 'month';

export default function Stats() {
  const { t, locale } = useT();
  const { width } = useScreen();
  const { nights, bed, wake, fullMoons } = useApp();
  const [range, setRange] = useState<Range>('week');
  const days = range === 'week' ? 7 : 30;

  const data = useMemo(() => {
    const now = new Date();
    const tonight = nightKey(now);
    // Сегодняшнюю ночь показываем, только если уже есть отметка.
    const last = nights[tonight]?.bedAt ? tonight : addDaysKey(tonight, -1);
    const out: (ChartNight & { dur?: number })[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = addDaysKey(last, -i);
      const rec = nights[key];
      const d = keyToDate(key);
      out.push({
        key,
        label:
          range === 'week' ? d.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '') : String(d.getDate()),
        bed: tsToMinutes(rec?.bedAt),
        wake: tsToMinutes(rec?.wakeAt),
        onTime: rec?.onTime,
        dur: rec?.bedAt && rec?.wakeAt ? (rec.wakeAt - rec.bedAt) / 60000 : undefined,
      });
    }
    return out;
  }, [nights, days, range, locale]);

  const durations = data.map((d) => d.dur).filter((x): x is number => x !== undefined);
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  const beds = data
    .map((d) => d.bed)
    .filter((x): x is number => x !== undefined)
    .map(eveningMinutes);
  // Регулярность — разброс времени отхода ко сну (стандартное отклонение).
  let reg: keyof typeof t.stats.reg = 'none';
  if (beds.length >= 3) {
    const mean = beds.reduce((a, b) => a + b, 0) / beds.length;
    const sd = Math.sqrt(beds.reduce((a, b) => a + (b - mean) ** 2, 0) / beds.length);
    reg = sd <= 30 ? 'great' : sd <= 60 ? 'good' : 'drifting';
  }
  const onTimeCount = data.filter((d) => d.onTime).length;
  const empty = data.every((d) => d.bed === undefined);

  return (
    <SkyBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton label={t.common.back} onPress={() => router.back()}>
            <BackIcon />
          </IconButton>
          <AppText variant="heading">{t.stats.title}</AppText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.segment}>
            {(['week', 'month'] as Range[]).map((r) => (
              <Pressable
                key={r}
                accessibilityRole="tab"
                accessibilityState={{ selected: range === r }}
                onPress={() => {
                  haptic.tick();
                  setRange(r);
                }}
                style={[styles.segBtn, range === r && styles.segOn]}
              >
                <AppText
                  style={{ fontFamily: fonts.semibold, fontSize: 15 }}
                  color={range === r ? night.onAccent : night.secondary}
                >
                  {t.stats[r]}
                </AppText>
              </Pressable>
            ))}
          </View>

          <Animated.View entering={FadeInDown.duration(500)}>
            <Glass padded={false}>
              <View style={styles.tiles}>
                <Tile value={avg !== null ? formatDuration(Math.round(avg / 5) * 5, t) : '—'} label={t.stats.average} />
                <View style={styles.divider} />
                <Tile value={t.stats.reg[reg]} label={t.stats.regularity} />
                <View style={styles.divider} />
                <Tile value={String(fullMoons)} label={t.stats.fullMoons} />
              </View>
            </Glass>
          </Animated.View>

          <Animated.View key={range} entering={FadeIn.duration(500)}>
            <Glass>
              {empty ? (
                <AppText variant="caption" align="center" style={{ paddingVertical: space.xl }}>
                  {t.stats.empty}
                </AppText>
              ) : (
                <>
                  <View style={styles.chartHead}>
                    <AppText style={{ fontFamily: fonts.light, fontSize: 30 }}>
                      {onTimeCount}
                      <AppText variant="caption"> / {days}</AppText>
                    </AppText>
                    <AppText variant="caption">{t.stats.onTime.toLowerCase()}</AppText>
                  </View>
                  <SleepChart data={data} width={width - space.lg * 2 - 44} targetBed={bed} targetWake={wake} />
                  <View style={styles.legend}>
                    <Legend color={night.accent} label={t.stats.onTime} />
                    <Legend color={night.secondary} label={t.stats.late} />
                    <Legend color="rgba(255,184,107,0.6)" label={t.stats.goal} dashed />
                  </View>
                </>
              )}
            </Glass>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <AppText style={styles.tileValue} align="center" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="caption" style={styles.tileLabel} align="center" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={
          dashed
            ? { width: 14, borderTopWidth: 1.5, borderColor: color, borderStyle: 'dashed' }
            : { width: 10, height: 10, borderRadius: 5, backgroundColor: color }
        }
      />
      <AppText variant="caption" style={{ fontSize: 13 }}>
        {label}
      </AppText>
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
  },
  scroll: { padding: space.lg, gap: space.md },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: night.glass,
    borderWidth: 1,
    borderColor: night.glassBorder,
  },
  segBtn: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: night.accent },
  tiles: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 8 },
  tile: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  divider: { width: 1, height: 34, backgroundColor: night.glassBorder },
  tileValue: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 },
  tileLabel: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  chartHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: space.sm },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: space.sm },
});
