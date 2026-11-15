import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import type { TaskType } from '@/lib/morningTask';
import { night } from '@/theme';
import { AppText } from './AppText';
import { Glass } from './Glass';
import { CameraIcon, CheckIcon, StepsIcon, SumIcon } from './Icons';

export const TASK_ICONS = { sky: CameraIcon, math: SumIcon, steps: StepsIcon } as const;
// Шагомера в браузере нет — на вебе это задание не предлагаем.
export const TASK_TYPES: TaskType[] = Platform.OS === 'web' ? ['sky', 'math'] : ['sky', 'math', 'steps'];

/** Круглый значок задания. */
export function TaskBadge({
  type,
  tone = 'night',
  size = 44,
}: {
  type: TaskType;
  tone?: 'night' | 'dawn';
  size?: number;
}) {
  const Icon = TASK_ICONS[type];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone === 'night' ? 'rgba(255,184,107,0.16)' : 'rgba(255,255,255,0.55)',
      }}
    >
      <Icon size={size * 0.5} color={tone === 'night' ? night.accent : '#C98A1B'} />
    </View>
  );
}

/** Выбор утреннего задания карточками (настройки). */
export function TaskPicker({ value, onChange }: { value: TaskType; onChange: (v: TaskType) => void }) {
  const { t } = useT();
  return (
    <Glass padded={false}>
      {TASK_TYPES.map((k, i) => {
        const selected = value === k;
        return (
          <Pressable
            key={k}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              haptic.tick();
              onChange(k);
            }}
            style={[styles.row, i > 0 && styles.divider]}
          >
            <TaskBadge type={k} />
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 17 }}>{t.task.names[k]}</AppText>
              <AppText variant="caption" style={{ fontSize: 13, lineHeight: 18 }}>
                {t.task.hints[k]}
              </AppText>
            </View>
            <View style={[styles.radio, selected && styles.radioOn]}>{selected && <CheckIcon size={13} />}</View>
          </Pressable>
        );
      })}
    </Glass>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: night.glassBorder },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(165,168,240,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: night.accent, borderColor: night.accent },
});
