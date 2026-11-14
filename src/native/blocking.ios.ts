// iPhone: блокировка через Screen Time API (FamilyControls + ManagedSettings + DeviceActivity),
// библиотека react-native-device-activity. Включение и снятие по расписанию делает iOS-расширение
// DeviceActivityMonitor — даже когда Luna закрыта.
//
// ⚠️ Не проверено на устройстве: нужна собственная сборка (EAS) и одобрение Family Controls от Apple.
import type * as RNDA from 'react-native-device-activity';

import type { BlockingApi, NativeAuth } from './types';

const ACTIVITY = 'luna-night';

// В Expo Go нативного модуля нет — require бросает ошибку, тогда работаем как заглушка.
let lib: typeof RNDA | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- нужен ленивый импорт под try
  lib = require('react-native-device-activity');
  if (!lib?.isAvailable()) lib = null;
} catch {
  lib = null;
}

const toAuth = (s: number): NativeAuth => (s === 2 ? 'approved' : s === 1 ? 'denied' : 'notDetermined');
const hm = (min: number) => ({ hour: Math.floor(min / 60) % 24, minute: min % 60 });

export const blocking: BlockingApi = {
  isAvailable: () => !!lib,
  authorization: () => (lib ? toAuth(lib.getAuthorizationStatus()) : 'unavailable'),
  requestAuthorization: async () => {
    if (!lib) return 'unavailable';
    await lib.requestAuthorization('individual');
    return toAuth(lib.getAuthorizationStatus());
  },
  schedule: async (startMin, endMin, shield) => {
    if (!lib) return;
    // Экран-щит: Apple разрешает только иконку, тексты, цвета и до 2 кнопок. Кнопки «отложить» нет.
    lib.updateShield(
      {
        title: shield.title,
        subtitle: shield.subtitle,
        primaryButtonLabel: shield.button,
        iconSystemName: 'moon.stars.fill',
        iconTint: { red: 255, green: 184, blue: 107, alpha: 1 },
        backgroundColor: { red: 11, green: 16, blue: 38, alpha: 1 },
        titleColor: { red: 243, green: 233, blue: 220, alpha: 1 },
        subtitleColor: { red: 165, green: 168, blue: 240, alpha: 1 },
        primaryButtonBackgroundColor: { red: 255, green: 184, blue: 107, alpha: 1 },
        primaryButtonLabelColor: { red: 42, green: 26, blue: 10, alpha: 1 },
      },
      { primary: { behavior: 'close' } },
    );
    lib.configureActions({
      activityName: ACTIVITY,
      callbackName: 'intervalDidStart',
      actions: [{ type: 'enableBlockAllMode' }],
    });
    lib.configureActions({
      activityName: ACTIVITY,
      callbackName: 'intervalDidEnd',
      actions: [{ type: 'disableBlockAllMode' }],
    });
    lib.stopMonitoring([ACTIVITY]);
    await lib.startMonitoring(ACTIVITY, { intervalStart: hm(startMin), intervalEnd: hm(endMin), repeats: true }, []);
  },
  unlockNow: () => lib?.disableBlockAllMode('morning-task'),
  stop: () => {
    lib?.stopMonitoring([ACTIVITY]);
    lib?.disableBlockAllMode('stopped');
  },
};
