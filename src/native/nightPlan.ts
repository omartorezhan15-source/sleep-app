// Синхронизация «ночного плана» с iPhone: расписание блокировки, цепочка будильников,
// отметки «отложили будильник» и «блокировку выключили в Настройках».
// На вебе и в Expo Go все вызовы — пустые (нативных модулей нет).
import { fill, getDict } from '@/i18n';
import { AUTO_UNLOCK_MIN } from '@/lib/blocking';
import { formatClock, inWindow, mod, nightKey } from '@/lib/time';
import { useApp } from '@/store/useApp';
import { alarm } from './alarm';
import { blocking } from './blocking';

export const nativeAvailable = () => blocking.isAvailable() || alarm.isAvailable();

export async function syncNightPlan(now = new Date()) {
  const s = useApp.getState();
  if (!s.onboarded) return;
  const d = getDict(s.locale);
  const unlockAt = mod(s.wake + AUTO_UNLOCK_MIN, 1440);

  // «Ещё 5 минут» нажимают на системном экране будильника — забираем отметку в историю ночи.
  const snoozedAt = alarm.consumeSnoozedAt();
  if (snoozedAt > 0) s.markSnooze(new Date(snoozedAt * 1000));

  if (s.blockingEnabled && blocking.isAvailable()) {
    if (blocking.authorization() !== 'approved') {
      // Доступ к «Экранному времени» отозвали в Настройках — честно отмечаем ночь и выключаем режим.
      // Отмечаем последнюю наступившую ночь: днём (после полудня и до отбоя) — вчерашнюю.
      const t = now.getHours() * 60 + now.getMinutes();
      const nightStarted = inWindow(t, s.bed, 12 * 60);
      s.markBlockingRevoked(nightStarted ? now : new Date(now.getTime() - 24 * 3600_000));
      s.set({ blockingEnabled: false });
    } else {
      await blocking
        .schedule(s.bed, unlockAt, {
          title: d.blocking.shieldTitle,
          subtitle: fill(d.blocking.shieldSubtitle, { time: formatClock(unlockAt) }),
          button: d.blocking.shieldButton,
        })
        .catch(() => {});
    }
  }

  if (s.alarmEnabled && alarm.isAvailable()) {
    const taskDone = !!s.nights[nightKey(now)]?.taskDoneAt;
    await alarm
      .scheduleUpcoming(s.wake, now, taskDone, {
        title: d.alarm.title,
        stop: d.alarm.stop,
        snooze: d.alarm.snooze,
        task: d.alarm.task,
      })
      .catch(() => 0);
  }
}

/** Утреннее задание выполнено: снять блокировку сразу и убрать сегодняшние звонки. */
export async function onMorningTaskDone(now = new Date()) {
  blocking.unlockNow();
  alarm.cancelAll();
  await syncNightPlan(now);
}

export async function enableBlocking() {
  const auth = await blocking.requestAuthorization();
  useApp.getState().set({ blockingEnabled: auth === 'approved' });
  await syncNightPlan();
  return auth;
}

export async function enableAlarm() {
  const auth = await alarm.requestAuthorization();
  useApp.getState().set({ alarmEnabled: auth === 'authorized' });
  await syncNightPlan();
  return auth;
}
