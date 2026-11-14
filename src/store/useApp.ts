import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deviceLocale } from '@/lib/locale';
import type { TaskType } from '@/lib/morningTask';
import { addDaysKey, eveningMinutes, minutesOfDay, nightKey } from '@/lib/time';

export type Goal = 'energy' | 'growth' | 'study' | 'sport';

export type Obstacle = 'video' | 'games' | 'chat' | 'study' | 'thoughts';

export type NightRecord = {
  bedAt?: number; // timestamp отметки «Я в кровати»
  wakeAt?: number; // timestamp отметки «Встаю»
  targetBed: number; // минуты дня, цель на эту ночь
  targetWake: number;
  onTime?: boolean;
  /** Утреннее задание выполнено — блокировка снята (этап 2). */
  taskDoneAt?: number;
  /** Сколько раз отложили будильник (максимум 1). */
  snoozes?: number;
  /** Блокировку отключили в системных Настройках этой ночью (сообщает нативная часть iPhone). */
  blockingRevoked?: boolean;
};

export const MOON_MAX = 14;
/** Окно «вовремя»: отметка не позже цели + 30 минут. */
export const ON_TIME_GRACE = 30;

type State = {
  hydrated: boolean;
  onboarded: boolean;
  locale: 'ru' | 'en';
  age: number;
  goals: Goal[];
  obstacle: Obstacle | null;
  plan: string;
  bed: number;
  wake: number;
  remindersOn: boolean;
  taskType: TaskType;
  /** Этап 2 (iPhone): блокировка и будильник включены пользователем. */
  blockingEnabled: boolean;
  alarmEnabled: boolean;
  moonPhase: number; // 1..14
  fullMoons: number;
  nights: Record<string, NightRecord>;
  processedThrough: string | null; // последняя ночь, по которой уже применено «убывание»
};

type Actions = {
  set: (p: Partial<State>) => void;
  completeOnboarding: () => void;
  markBed: (now?: Date) => { onTime: boolean };
  undoBed: (now?: Date) => void;
  markWake: (now?: Date) => void;
  completeTask: (now?: Date) => void;
  markSnooze: (now?: Date) => void;
  markBlockingRevoked: (now?: Date) => void;
  processMissedNights: (now?: Date) => void;
  reset: () => void;
};

const initial: Omit<State, 'hydrated' | 'locale'> = {
  onboarded: false,
  age: 16,
  goals: [],
  obstacle: null,
  plan: '',
  bed: 22 * 60,
  wake: 7 * 60,
  remindersOn: false,
  taskType: 'sky',
  blockingEnabled: false,
  alarmEnabled: false,
  moonPhase: 1,
  fullMoons: 0,
  nights: {},
  processedThrough: null,
};

/** Отметка вовремя, если человек лёг не позже цели + 30 минут (раньше — тоже хорошо). */
export function isOnTime(bedAt: Date, targetBed: number) {
  // Сравниваем в «вечерних минутах», чтобы 00:20 было позже 23:50.
  return eveningMinutes(minutesOfDay(bedAt)) <= eveningMinutes(targetBed) + ON_TIME_GRACE;
}

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      hydrated: false,
      locale: deviceLocale(),
      set: (p) => set(p),

      completeOnboarding: () => {
        const yesterday = addDaysKey(nightKey(new Date()), -1);
        set({ onboarded: true, processedThrough: yesterday });
      },

      markBed: (now = new Date()) => {
        const s = get();
        const key = nightKey(now);
        const prev = s.nights[key];
        const onTime = isOnTime(now, s.bed);
        const rec: NightRecord = { ...prev, bedAt: now.getTime(), targetBed: s.bed, targetWake: s.wake, onTime };
        // Растём/убываем только один раз за ночь.
        let { moonPhase, fullMoons } = s;
        if (prev?.onTime === undefined) {
          if (onTime) {
            if (moonPhase === MOON_MAX - 1) fullMoons += 1;
            moonPhase = Math.min(MOON_MAX, moonPhase + 1);
          } else {
            moonPhase = Math.max(1, moonPhase - 1);
          }
        }
        set({ nights: { ...s.nights, [key]: rec }, moonPhase, fullMoons });
        return { onTime };
      },

      undoBed: (now = new Date()) => {
        const s = get();
        const key = nightKey(now);
        const rec = s.nights[key];
        if (!rec?.bedAt) return;
        let { moonPhase, fullMoons } = s;
        if (rec.onTime) {
          if (moonPhase === MOON_MAX && fullMoons > 0) fullMoons -= 1;
          moonPhase = Math.max(1, moonPhase - 1);
        } else {
          moonPhase = Math.min(MOON_MAX, moonPhase + 1);
        }
        const nights = { ...s.nights };
        delete nights[key];
        set({ nights, moonPhase, fullMoons });
      },

      markWake: (now = new Date()) => {
        const s = get();
        const key = nightKey(now);
        const rec = s.nights[key] ?? { targetBed: s.bed, targetWake: s.wake };
        set({ nights: { ...s.nights, [key]: { ...rec, wakeAt: now.getTime() } } });
      },

      completeTask: (now = new Date()) => {
        const s = get();
        const key = nightKey(now);
        const rec = s.nights[key] ?? { targetBed: s.bed, targetWake: s.wake };
        set({ nights: { ...s.nights, [key]: { ...rec, taskDoneAt: now.getTime() } } });
      },

      markSnooze: (now = new Date()) => {
        const s = get();
        const key = nightKey(now);
        const rec = s.nights[key] ?? { targetBed: s.bed, targetWake: s.wake };
        set({ nights: { ...s.nights, [key]: { ...rec, snoozes: (rec.snoozes ?? 0) + 1 } } });
      },

      markBlockingRevoked: (now = new Date()) => {
        const s = get();
        const key = nightKey(now);
        const rec = s.nights[key] ?? { targetBed: s.bed, targetWake: s.wake };
        set({ nights: { ...s.nights, [key]: { ...rec, blockingRevoked: true } } });
      },

      /** Прошедшие ночи без отметки — луна убывает на одну фазу за каждую. */
      processMissedNights: (now = new Date()) => {
        const s = get();
        if (!s.onboarded || !s.processedThrough) return;
        const lastFinished = addDaysKey(nightKey(now), -1);
        let key = s.processedThrough;
        let { moonPhase } = s;
        let guard = 0;
        while (key < lastFinished && guard++ < 60) {
          key = addDaysKey(key, 1);
          if (s.nights[key]?.onTime === undefined) moonPhase = Math.max(1, moonPhase - 1);
        }
        if (key !== s.processedThrough) set({ moonPhase, processedThrough: key });
      },

      reset: () => set({ ...initial }),
    }),
    {
      name: 'luna-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, set, ...rest }) => rest as never,
      onRehydrateStorage: () => () => {
        useApp.setState({ hydrated: true });
      },
    },
  ),
);
