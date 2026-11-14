// Палитра «Ночное небо» и «Рассвет» из PLAN.md, раздел 3.
export const night = {
  bgTop: '#0B1026',
  bgBottom: '#1B1F4B',
  bgDeep: '#070A1A',
  accent: '#FFB86B',
  accentDeep: '#E89A4F',
  secondary: '#A5A8F0',
  text: '#F3E9DC',
  textSecondary: 'rgba(165,168,240,0.78)',
  textMuted: 'rgba(243,233,220,0.45)',
  glass: 'rgba(165,168,240,0.08)',
  glassBorder: 'rgba(255,255,255,0.07)',
  moonLight: '#FFF1D6',
  moonEdge: '#F3D9A8',
  onAccent: '#2A1A0A',
} as const;

export const dawn = {
  bgTop: '#FFD9C2',
  bgBottom: '#FFB3C1',
  accent: '#F6C453',
  secondary: '#8A6FA8',
  text: '#3B2A3F',
  textSecondary: 'rgba(59,42,63,0.62)',
  glass: 'rgba(255,255,255,0.35)',
  glassBorder: 'rgba(255,255,255,0.5)',
  onAccent: '#3B2A3F',
} as const;

export const fonts = {
  extraLight: 'Nunito_200ExtraLight',
  light: 'Nunito_300Light',
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
} as const;

export const space = { xs: 6, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { card: 28, pill: 999 } as const;
