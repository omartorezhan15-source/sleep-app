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

export function BoltIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13.5 2.5L5 13.5h6l-1 8 8.5-11h-6z" fill={color} />
    </Svg>
  );
}

export function SproutIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21v-9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5z" fill={color} />
      <Path d="M12 14.5c0-3-2-5-5.5-5 0 3.5 2 5 5.5 5z" fill={color} opacity={0.7} />
    </Svg>
  );
}

export function BookIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6.5C10 5 7.5 4.5 4 4.5v13c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-13c-3.5 0-6 .5-8 2z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path d="M12 6.5v13" stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}

export function PulseIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12.5h4l2.5-6 4 12 2.5-6h6"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CameraIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1-1.6A1 1 0 0 1 9.55 4h4.9a1 1 0 0 1 .85.4l1 1.6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12.3" r="3.3" stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}

export function SumIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 8h6M8 5v6M14 8h5M5.5 14.5l5 5M10.5 14.5l-5 5M14 15.5h5M14 18.5h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StepsIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M8.2 3.5c1.9 0 3 1.9 3 4.4 0 1.9-.6 3.2-.6 4.6H6.2c0-1.4-1-2.7-1-4.6 0-2.5 1.1-4.4 3-4.4z"
        fill={color}
      />
      <Path d="M6.3 14.2h4.2c0 1.8-.700 3-2.1 3s-2.1-1.2-2.1-3z" fill={color} />
      <Path
        d="M16 7.5c1.9 0 3 1.9 3 4.4 0 1.9-1 3.2-1 4.6h-4.4c0-1.4-.6-2.7-.6-4.6 0-2.5 1.1-4.4 3-4.4z"
        fill={color}
        opacity={0.7}
      />
      <Path d="M13.7 18.2h4.2c0 1.8-.700 3-2.1 3s-2.1-1.2-2.1-3z" fill={color} opacity={0.7} />
    </Svg>
  );
}

export function PhoneSleepIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6.5" y="3" width="11" height="18" rx="2.6" stroke={color} strokeWidth={1.9} />
      <Path d="M13.6 13.3a2.9 2.9 0 1 1-2.9-3.7 2.3 2.3 0 0 0 2.9 3.7z" fill={color} />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = night.accent }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path d="M10 20.5a2.2 2.2 0 0 0 4 0" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function CallIcon({ size = 18, color = night.secondary }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BackspaceIcon({ size = 26, color = night.text }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5.5h9.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9L3.5 12z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M11.5 9.5l5 5M16.5 9.5l-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
