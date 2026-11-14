import { Pressable, StyleSheet } from 'react-native';

import { haptic } from '@/lib/haptics';
import { night, radius } from '@/theme';
import { AppText } from './AppText';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.tick();
        onPress();
      }}
      style={[styles.chip, selected && styles.selected]}
    >
      <AppText style={{ fontSize: 15 }} color={selected ? night.onAccent : night.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: night.glass,
    borderWidth: 1,
    borderColor: night.glassBorder,
  },
  selected: { backgroundColor: night.accent, borderColor: night.accent },
});
