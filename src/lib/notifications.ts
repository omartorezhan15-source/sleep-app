import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { Dict } from '@/i18n/ru';
import { mod } from './time';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';
const CHANNEL = 'bedtime';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestReminderPermission() {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Bedtime',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 120, 80, 120],
      lightColor: '#FFB86B',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

/**
 * «Лестница» напоминаний (research.md, раздел 5: внешний сигнал против «потери счёта времени»):
 * за 60, 30, 10 минут и в момент сна + утреннее в момент подъёма.
 * Уведомления, которые нельзя смахнуть, в iOS невозможны, поэтому настойчивость — в повторении.
 */
export async function scheduleReminders(bed: number, wake: number, d: Dict) {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const items: { at: number; content: { title: string; body: string } }[] = [
    { at: bed - 60, content: d.notifications.h60 },
    { at: bed - 30, content: d.notifications.h30 },
    { at: bed - 10, content: d.notifications.h10 },
    { at: bed, content: d.notifications.h0 },
    { at: wake, content: d.notifications.wake },
  ];
  for (const it of items) {
    const m = mod(it.at, 1440);
    await Notifications.scheduleNotificationAsync({
      content: { ...it.content, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: Math.floor(m / 60),
        minute: m % 60,
        channelId: CHANNEL,
      },
    });
  }
}

export async function cancelReminders() {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
