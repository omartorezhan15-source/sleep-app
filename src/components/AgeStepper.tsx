import { Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { fonts, night } from '@/theme';
import { AppText } from './AppText';

export const MIN_AGE = 13;
export const MAX_AGE = 99;

function StepBtn({ sign, onPress, disabled }: { sign: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sign === '+' ? '+1' : '-1'}
      disabled={disabled}
      hitSlop={10}
      onPress={() => {
        haptic.tick();
        onPress();
      }}
      style={({ pressed }) => [styles.btn, { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}
    >
      <AppText style={styles.sign}>{sign}</AppText>
    </Pressable>
  );
}

export function AgeStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityValue={{ now: value, min: MIN_AGE, max: MAX_AGE }}>
      <StepBtn sign="−" disabled={value <= MIN_AGE} onPress={() => onChange(Math.max(MIN_AGE, value - 1))} />
      <AppText style={styles.value}>{value}</AppText>
      <StepBtn sign="+" disabled={value >= MAX_AGE} onPress={() => onChange(Math.min(MAX_AGE, value + 1))} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  btn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: night.glass,
    borderWidth: 1,
    borderColor: night.glassBorder,
  },
  sign: { fontSize: 26, lineHeight: 30, color: night.secondary, fontFamily: fonts.light },
  value: { fontFamily: fonts.extraLight, fontSize: 64, lineHeight: 72, minWidth: 90, textAlign: 'center' },
});
