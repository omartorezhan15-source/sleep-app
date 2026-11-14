// Правила блокировки и будильника (этап 2). Чистые функции: их использует и JS-интерфейс,
// и (позже) нативная часть iPhone — расписание DeviceActivity и цепочка AlarmKit строятся отсюда.
//
// Решения владельца продукта:
// - Блокировка: с отбоя до подъёма — всё выключено, отложить нельзя.
// - Утром: снимается после утреннего задания, а через 60 минут после подъёма — сама (страховка).
// - Будильник: отложить на 5 минут можно один раз, потом — только задание.

import { inWindow, minutesOfDay, mod } from './time';
import type { NightRecord } from '@/store/useApp';

export const AUTO_UNLOCK_MIN = 60;
export const SNOOZE_MIN = 5;
export const MAX_SNOOZES = 1;
/** Повтор будильника после «Стоп», пока задание не выполнено. */
export const ALARM_REPEAT_MIN = 5;

export type BlockingPhase =
  | 'off' // день: блокировки нет
  | 'night' // с отбоя до подъёма: всё заблокировано
  | 'awaitingTask' // подъём наступил, задание не выполнено: всё ещё заблокировано
  | 'unlockedByTask' // задание выполнено
  | 'unlockedAuto'; // прошло 60 минут после подъёма

export type BlockingStatus = {
  phase: BlockingPhase;
  locked: boolean;
  /** Когда блокировка снимется сама (минуты дня), если она сейчас активна. */
  autoUnlockAt?: number;
};

/** `rec` — запись текущей ночи: `nights[nightKey(now)]`. */
export function blockingStatus(now: Date, bed: number, wake: number, rec?: NightRecord): BlockingStatus {
  const t = minutesOfDay(now);
  const autoUnlockAt = mod(wake + AUTO_UNLOCK_MIN, 1440);
  const taskDone = !!rec?.taskDoneAt;

  if (inWindow(t, bed, wake)) {
    // Задание можно сделать и раньше подъёма (проснулся сам) — тогда телефон уже свободен.
    return taskDone ? { phase: 'unlockedByTask', locked: false } : { phase: 'night', locked: true, autoUnlockAt };
  }
  if (inWindow(t, wake, autoUnlockAt)) {
    return taskDone
      ? { phase: 'unlockedByTask', locked: false }
      : { phase: 'awaitingTask', locked: true, autoUnlockAt };
  }
  // Утро после автоснятия (до полудня ключ ночи прежний) — отмечаем, как именно снялось.
  if (inWindow(t, autoUnlockAt, 12 * 60)) {
    return { phase: taskDone ? 'unlockedByTask' : 'unlockedAuto', locked: false };
  }
  return { phase: 'off', locked: false };
}

/**
 * Время звонков будильника (минуты дня): подъём, затем каждые 5 минут до автоснятия.
 * Цепочка отменяется, как только выполнено задание. Кнопка «Ещё 5 минут» есть только у первого звонка
 * (это просто следующий звонок цепочки), у остальных — только «Задание».
 */
export function alarmTimes(wake: number) {
  const out: number[] = [];
  for (let m = 0; m < AUTO_UNLOCK_MIN; m += ALARM_REPEAT_MIN) out.push(mod(wake + m, 1440));
  return out;
}

/** Можно ли сейчас отложить будильник (только один раз и только на первом звонке). */
export function canSnooze(rec?: NightRecord) {
  return (rec?.snoozes ?? 0) < MAX_SNOOZES;
}
