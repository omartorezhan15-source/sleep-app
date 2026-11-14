import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { night } from '@/theme';

type P = { size?: number; color?: string };

export function ChartIcon({ size = 20, color = night.secondary }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="4" y="11" width="3.2" height="9" rx="1.6" fill={color} />
      <Rect x="10.4" y="5" width="3.2" height="15" rx="1.6" fill={color} />
      <Rect x="16.8" y="8" width="3.2" height="12" rx="1.6" fill={color} />
    </Svg>
  );
}

export function SlidersIcon({ size = 20, color = night.secondary }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="16" cy="7" r="2.4" stroke={color} strokeWidth={2} />
      <Circle cx="10" cy="17" r="2.4" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function BackIcon({ size = 20, color = night.secondary }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color = night.onAccent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoonGlyph({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill={color} />
    </Svg>
  );
}

export function SunGlyph({ size = 22, color = '#FFD27A' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4.6" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        const x1 = 12 + Math.cos(rad) * 7.4;
        const y1 = 12 + Math.sin(rad) * 7.4;
        const x2 = 12 + Math.cos(rad) * 9.8;
        const y2 = 12 + Math.sin(rad) * 9.8;
        return <Path key={a} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={color} strokeWidth={2} strokeLinecap="round" />;
      })}
    </Svg>
  );
}
