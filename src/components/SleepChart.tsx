import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useSvgId } from '@/lib/useSvgId';

import { eveningMinutes, formatClock, minutesOfDay } from '@/lib/time';
import { fonts, night } from '@/theme';

export type ChartNight = {
  key: string;
  label: string;
  bed?: number; // минуты дня
  wake?: number;
  onTime?: boolean;
  /** Блокировку выключили в Настройках (этап 2) — тонкая отметка над полоской. */
  revoked?: boolean;
};

type Props = { data: ChartNight[]; width: number; height?: number; targetBed: number; targetWake: number };

// Шкала ночи: 20:00 сверху → 10:00 снизу (в «вечерних минутах» от полудня).
const TOP = eveningMinutes(20 * 60);
const BOTTOM = eveningMinutes(10 * 60);
const AXIS = [20, 0, 4, 8].map((h) => h * 60);

export function SleepChart({ data, width, height = 260, targetBed, targetWake }: Props) {
  const ids = { onTime: useSvgId('onTime'), late: useSvgId('late') };

  const left = 42;
  const bottomPad = 26;
  const plotH = height - bottomPad - 8;
  const plotW = width - left - 4;
  const y = (min: number) =>
    8 + ((Math.min(Math.max(eveningMinutes(min), TOP), BOTTOM) - TOP) / (BOTTOM - TOP)) * plotH;
  const slot = plotW / data.length;
  const barW = Math.max(4, Math.min(22, slot * 0.56));
  const dense = data.length > 10;

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={ids.onTime} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={night.accent} />
            <Stop offset="1" stopColor="#F6C453" />
          </LinearGradient>
          <LinearGradient id={ids.late} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={night.secondary} stopOpacity={0.9} />
            <Stop offset="1" stopColor={night.secondary} stopOpacity={0.55} />
          </LinearGradient>
        </Defs>

        {AXIS.map((m) => (
          <SvgText key={m} x={0} y={y(m) + 4} fill="rgba(165,168,240,0.55)" fontSize={11} fontFamily={fonts.semibold}>
            {formatClock(m)}
          </SvgText>
        ))}
        {AXIS.map((m) => (
          <Line
            key={`l${m}`}
            x1={left}
            x2={width}
            y1={y(m)}
            y2={y(m)}
            stroke="rgba(165,168,240,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Цель — пунктир */}
        {[targetBed, targetWake].map((m, i) => (
          <Line
            key={`t${i}`}
            x1={left}
            x2={width}
            y1={y(m)}
            y2={y(m)}
            stroke="rgba(255,184,107,0.45)"
            strokeWidth={1.2}
            strokeDasharray="4 5"
          />
        ))}

        {data.map((n, i) => {
          const cx = left + slot * i + slot / 2;
          const showLabel = !dense || i % 5 === 0 || i === data.length - 1;
          return (
            <G key={n.key}>
              {n.bed !== undefined ? (
                <Rect
                  x={cx - barW / 2}
                  y={y(n.bed)}
                  width={barW}
                  height={Math.max(barW, y(n.wake ?? n.bed + 8 * 60) - y(n.bed))}
                  rx={barW / 2}
                  fill={n.onTime ? `url(#${ids.onTime})` : `url(#${ids.late})`}
                  opacity={n.wake === undefined ? 0.5 : 1}
                />
              ) : (
                <Circle cx={cx} cy={y(targetBed)} r={2.5} fill="rgba(165,168,240,0.3)" />
              )}
              {n.revoked && (
                <Circle cx={cx} cy={y(n.bed ?? targetBed) - barW / 2 - 7} r={2.5} fill={night.text} opacity={0.7} />
              )}
              {showLabel && (
                <SvgText
                  x={cx}
                  y={height - 6}
                  fill="rgba(165,168,240,0.6)"
                  fontSize={11}
                  fontFamily={fonts.semibold}
                  textAnchor="middle"
                >
                  {n.label}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export const tsToMinutes = (ts?: number) => (ts === undefined ? undefined : minutesOfDay(new Date(ts)));
