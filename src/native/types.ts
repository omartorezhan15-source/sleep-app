export type NativeAuth = 'approved' | 'denied' | 'notDetermined' | 'unavailable';

export type ShieldTexts = { title: string; subtitle: string; button: string };

export type BlockingApi = {
  /** Есть ли нативная блокировка (только собственная сборка под iPhone, не Expo Go и не веб). */
  isAvailable(): boolean;
  authorization(): NativeAuth;
  requestAuthorization(): Promise<NativeAuth>;
  /** Каждую ночь с startMin до endMin (минуты дня) — блокировать все приложения. */
  schedule(startMin: number, endMin: number, shield: ShieldTexts): Promise<void>;
  /** Снять блокировку прямо сейчас (утреннее задание выполнено). */
  unlockNow(): void;
  /** Полностью выключить расписание блокировки. */
  stop(): void;
};
