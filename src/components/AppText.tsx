import { StyleSheet, Text, type TextProps } from 'react-native';

import { fonts, night } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

type Props = TextProps & { variant?: Variant; color?: string; align?: 'left' | 'center' | 'right' };

export function AppText({ variant = 'body', color, align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[styles.base, styles[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: night.text, fontFamily: fonts.regular },
  display: {
    fontFamily: fonts.light,
    fontSize: 72,
    lineHeight: 80,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 27 },
  body: { fontSize: 16, lineHeight: 23 },
  caption: { fontSize: 15, lineHeight: 21, color: night.textSecondary },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: night.textSecondary,
  },
});
