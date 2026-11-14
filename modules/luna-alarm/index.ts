import { requireOptionalNativeModule } from 'expo-modules-core';

export type AlarmAuthorization = 'authorized' | 'denied' | 'notDetermined' | 'unsupported';

export type LunaAlarmItem = {
  /** UUID */
  id: string;
  epochSeconds: number;
  title: string;
  stopLabel: string;
  secondaryLabel: string;
  secondaryKind: 'snooze' | 'task';
};

type LunaAlarmNative = {
  isSupported(): boolean;
  authorizationStatus(): AlarmAuthorization;
  requestAuthorization(): Promise<AlarmAuthorization>;
  scheduleChain(items: LunaAlarmItem[], tintHex: string): Promise<number>;
  cancelAll(): void;
  consumeSnoozedAt(): number;
};

/** null в Expo Go, в вебе, на Android и до первой собственной сборки под iPhone. */
export default requireOptionalNativeModule<LunaAlarmNative>('LunaAlarm');
