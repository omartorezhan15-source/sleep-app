import { View } from 'react-native';

import { useT } from '@/i18n';
import { fonts } from '@/theme';
import { AppText } from './AppText';

/** «2 ч 14 мин» — крупные цифры, мелкие единицы. */
export function BigDuration({ minutes, color, size = 72 }: { minutes: number; color?: string; size?: number }) {
  const { t } = useT();
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const unit = { fontFamily: fonts.regular, fontSize: size * 0.3, lineHeight: size * 0.42, marginLeft: 4, marginRight: 14 };
  const num = { fontSize: size, lineHeight: size * 1.1 };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }} accessible accessibilityLabel={`${h} ${t.common.hours} ${m} ${t.common.minutes}`}>
      {h > 0 && (
        <>
          <AppText variant="display" color={color} style={num}>
            {h}
          </AppText>
          <AppText color={color} style={unit}>
            {t.common.hours}
          </AppText>
        </>
      )}
      <AppText variant="display" color={color} style={num}>
        {h > 0 ? String(m).padStart(2, '0') : m}
      </AppText>
      <AppText color={color} style={[unit, { marginRight: 0 }]}>
        {t.common.minutes}
      </AppText>
    </View>
  );
}
