// Будильник через локальный модуль modules/luna-alarm (AlarmKit, iOS 26+). Везде, где модуля нет, — заглушка.
import LunaAlarm, { type AlarmAuthorization, type LunaAlarmItem } from '../../modules/luna-alarm';

import { alarmTimes } from '@/lib/blocking';
import { mod } from '@/lib/time';

/** Сколько дней вперёд держим цепочку будильников (на случай, если Luna не открывали). */
const DAYS_AHEAD = 2;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export type AlarmTexts = { title: string; stop: string; snooze: string; task: string };

export const alarm = {
  isAvailable: () => !!LunaAlarm?.isSupported(),
  authorization: (): AlarmAuthorization => LunaAlarm?.authorizationStatus() ?? 'unsupported',
  requestAuthorization: async (): Promise<AlarmAuthorization> =>
    (await LunaAlarm?.requestAuthorization()) ?? 'unsupported',

  /**
   * Планирует цепочки звонков на ближайшие дни. `skipToday` — задание сегодня уже выполнено.
   * Первый звонок дня — с «Ещё 5 минут», остальные — с «Задание».
   */
  async scheduleUpcoming(wake: number, now: Date, skipToday: boolean, texts: AlarmTexts) {
    if (!LunaAlarm?.isSupported()) return 0;
    const items: LunaAlarmItem[] = [];
    for (let day = 0; day <= DAYS_AHEAD; day++) {
      if (day === 0 && skipToday) continue;
      alarmTimes(wake).forEach((m, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() + day);
        // Звонок после полуночи относительно подъёма (цепочка может перейти через 00:00).
        const dayShift = mod(m - wake, 1440) + wake >= 1440 ? 1 : 0;
        d.setDate(d.getDate() + dayShift);
        d.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (d.getTime() <= now.getTime()) return;
        items.push({
          id: uuid(),
          epochSeconds: Math.floor(d.getTime() / 1000),
          title: texts.title,
          stopLabel: texts.stop,
          secondaryLabel: i === 0 ? texts.snooze : texts.task,
          secondaryKind: i === 0 ? 'snooze' : 'task',
        });
      });
    }
    return LunaAlarm.scheduleChain(items.slice(0, 12 * DAYS_AHEAD), '#FFB86B');
  },
  cancelAll: () => LunaAlarm?.cancelAll(),
  /** Отметка «отложили» от кнопки будильника (секунды) или 0. */
  consumeSnoozedAt: () => LunaAlarm?.consumeSnoozedAt() ?? 0,
};
