import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { formatDuration, formatRange, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { judgeDuration, type SleepGoal } from '@/lib/sleepGoal';
import { DAY, formatClock, mod, sleepDuration } from '@/lib/time';
import { fonts, night } from '@/theme';
import { AppText } from './AppText';
import { MoonGlyph, SunGlyph } from './Icons';

type Props = {
  bed: number;
  wake: number;
  onChange: (bed: number, wake: number) => void;
  goal: SleepGoal;
  size?: number;
};

const STEP = 5; // привязка к 5 минутам
const HANDLE = 46;

/** Минуты → угол (0 — полночь вверху, по часовой стрелке). */
const toAngle = (min: number) => (min / DAY) * Math.PI * 2 - Math.PI / 2;

/**
 * Круговой циферблат 24 часа. Тянешь луну (отбой) и солнце (подъём),
 * между ними светится дуга сна, в центре — длительность.
 */
export function SleepDial({ bed, wake, onChange, goal, size = 300 }: Props) {
  const { t, f } = useT();
  const c = size / 2;
  const r = c - HANDLE / 2 - 4;
  const active = useRef<'bed' | 'wake' | null>(null);
  const latest = useRef({ bed, wake });
  latest.current = { bed, wake };

  const point = (min: number, radius = r) => {
    const a = toAngle(min);
    return { x: c + Math.cos(a) * radius, y: c + Math.sin(a) * radius };
  };

  const pickMinutes = (x: number, y: number) => {
    const a = Math.atan2(y - c, x - c) + Math.PI / 2;
    const m = mod((a / (Math.PI * 2)) * DAY, DAY);
    return mod(Math.round(m / STEP) * STEP, DAY);
  };

  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (e) => {
      const { bed: b, wake: w } = latest.current;
      const pb = point(b);
      const pw = point(w);
      const db = Math.hypot(e.x - pb.x, e.y - pb.y);
      const dw = Math.hypot(e.x - pw.x, e.y - pw.y);
      const nearest = db <= dw ? 'bed' : 'wake';
      active.current = Math.min(db, dw) < HANDLE ? nearest : null;
      if (active.current) haptic.light();
    },
    onUpdate: (e) => {
      if (!active.current) return;
      const m = pickMinutes(e.x, e.y);
      const { bed: b, wake: w } = latest.current;
      const next = active.current === 'bed' ? { bed: m, wake: w } : { bed: b, wake: m };
      if (next.bed === next.wake) return;
      if (next.bed !== b || next.wake !== w) {
        haptic.tick();
        latest.current = next;
        onChange(next.bed, next.wake);
      }
    },
    onFinalize: () => {
      active.current = null;
    },
  });

  const dur = sleepDuration(bed, wake);
  const verdict = judgeDuration(dur, goal);
  const pb = point(bed);
  const pw = point(wake);
  const large = dur > DAY / 2 ? 1 : 0;
  const arc = `M ${pb.x} ${pb.y} A ${r} ${r} 0 ${large} 1 ${pw.x} ${pw.y}`;

  const ticks = Array.from({ length: 24 }, (_, h) => {
    const a = toAngle(h * 60);
    const inner = r - (h % 6 === 0 ? 14 : 9);
    const outer = r - 4;
    return {
      h,
      x1: c + Math.cos(a) * inner,
      y1: c + Math.sin(a) * inner,
      x2: c + Math.cos(a) * outer,
      y2: c + Math.sin(a) * outer,
    };
  });
  const labels = [0, 6, 12, 18].map((h) => {
    const p = point(h * 60, r - 32);
    return { h, ...p };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <GestureDetector gesture={pan}>
        <View
          style={{ width: size, height: size }}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${t.schedule.bed} ${formatClock(bed)}, ${t.schedule.wake} ${formatClock(wake)}`}
        >
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="arc" x1={pb.x} y1={pb.y} x2={pw.x} y2={pw.y} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={night.secondary} />
                <Stop offset="1" stopColor={night.accent} />
              </LinearGradient>
            </Defs>
            <Circle cx={c} cy={c} r={r} stroke="rgba(165,168,240,0.10)" strokeWidth={HANDLE - 4} fill="none" />
            <Circle cx={c} cy={c} r={r - HANDLE / 2 - 8} fill="rgba(11,16,38,0.55)" />
            {ticks.map((tk) => (
              <Line
                key={tk.h}
                x1={tk.x1}
                y1={tk.y1}
                x2={tk.x2}
                y2={tk.y2}
                stroke={tk.h % 6 === 0 ? 'rgba(243,233,220,0.45)' : 'rgba(165,168,240,0.25)'}
                strokeWidth={tk.h % 6 === 0 ? 2 : 1.2}
                strokeLinecap="round"
              />
            ))}
            {/* Свечение и сама дуга сна */}
            <Path d={arc} stroke="url(#arc)" strokeOpacity={0.25} strokeWidth={HANDLE + 8} strokeLinecap="round" fill="none" />
            <Path d={arc} stroke="url(#arc)" strokeWidth={HANDLE - 8} strokeLinecap="round" fill="none" />
            {labels.map((l) => (
              <SvgText
                key={l.h}
                x={l.x}
                y={l.y + 5}
                fill="rgba(165,168,240,0.7)"
                fontSize={13}
                fontFamily={fonts.semibold}
                textAnchor="middle"
              >
                {String(l.h).padStart(2, '0')}
              </SvgText>
            ))}
          </Svg>

          <View style={[styles.handle, { left: pb.x - HANDLE / 2, top: pb.y - HANDLE / 2 }]} pointerEvents="none">
            <MoonGlyph size={22} color={night.bgTop} />
          </View>
          <View
            style={[styles.handle, styles.sun, { left: pw.x - HANDLE / 2, top: pw.y - HANDLE / 2 }]}
            pointerEvents="none"
          >
            <SunGlyph size={24} color={night.bgTop} />
          </View>

          <View style={styles.center} pointerEvents="none">
            <AppText style={styles.duration}>{formatDuration(dur, t)}</AppText>
            <AppText variant="caption" align="center" style={styles.times}>
              {formatClock(bed)} → {formatClock(wake)}
            </AppText>
          </View>
        </View>
      </GestureDetector>
      <AppText
        variant="caption"
        align="center"
        color={verdict === 'short' ? night.accent : night.textSecondary}
        style={{ marginTop: 14, maxWidth: size }}
      >
        {f(t.schedule.verdict[verdict], { range: formatRange(goal.min, goal.max, t) })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: night.accent,
    shadowColor: night.accent,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  sun: { backgroundColor: '#FFD27A', shadowColor: '#FFD27A' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  duration: { fontFamily: fonts.light, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  times: { marginTop: 2 },
});
