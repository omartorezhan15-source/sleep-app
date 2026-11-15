import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { AUTO_UNLOCK_MIN } from '@/lib/blocking';
import { formatClock } from '@/lib/time';
import { fonts, night } from '@/theme';
import { AppText } from './AppText';
import { MoonGlyph, PhoneSleepIcon, SunGlyph } from './Icons';

/** Шкала ночи: телефон засыпает → будильник и задание → проснётся сам (через 60 минут). */
export function NightTimeline({ bed, wake }: { bed: number; wake: number }) {
  const { t } = useT();
  const points = [
    { time: bed, label: t.blocking.tlBed, align: 'flex-start' as const },
    { time: wake, label: t.blocking.tlWake, align: 'center' as const },
    { time: wake + AUTO_UNLOCK_MIN, label: t.blocking.tlAuto, align: 'flex-end' as const },
  ];
  return (
    <View accessible accessibilityLabel={points.map((p) => `${p.label} ${formatClock(p.time)}`).join(', ')}>
      <View style={styles.track}>
        <View style={[styles.node, { backgroundColor: night.accent }]}>
          <MoonGlyph size={18} color={night.bgTop} />
        </View>
        <LinearGradient
          colors={[night.accent, night.secondary, '#FFD27A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.solid}
        />
        <View style={[styles.node, { backgroundColor: '#FFD27A' }]}>
          <SunGlyph size={20} color={night.bgTop} />
        </View>
        <View style={styles.dashed} />
        <View style={[styles.node, styles.nodeGhost]}>
          <PhoneSleepIcon size={18} color={night.secondary} />
        </View>
      </View>
      <View style={styles.labels}>
        {points.map((p) => (
          <View key={p.label} style={{ flex: 1, alignItems: p.align }}>
            <AppText style={styles.time}>{formatClock(p.time)}</AppText>
            <AppText
              variant="caption"
              style={styles.caption}
              align={p.align === 'center' ? 'center' : p.align === 'flex-end' ? 'right' : 'left'}
            >
              {p.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', alignItems: 'center' },
  node: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nodeGhost: { backgroundColor: 'rgba(165,168,240,0.12)', borderWidth: 1.5, borderColor: 'rgba(165,168,240,0.45)' },
  solid: { flex: 1.5, height: 5, borderRadius: 3, marginHorizontal: 4 },
  dashed: {
    flex: 1,
    height: 0,
    marginHorizontal: 6,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(165,168,240,0.5)',
  },
  labels: { flexDirection: 'row', marginTop: 10, gap: 6 },
  time: { fontFamily: fonts.semibold, fontSize: 18, fontVariant: ['tabular-nums'] },
  caption: { fontSize: 12, lineHeight: 16, marginTop: 2 },
});
