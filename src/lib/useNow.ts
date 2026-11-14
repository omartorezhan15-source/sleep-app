import { useEffect, useState } from 'react';

import { inWindow, minutesOfDay, mod, nightKey } from './time';
import { useApp } from '@/store/useApp';

/** Текущее время, обновляется каждые `ms` миллисекунд. */
export function useNow(ms = 15_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export type DayPhase = 'day' | 'windDown' | 'bedtime' | 'inBed' | 'morning';

/**
 * Где человек сейчас в суточном цикле:
 * windDown — за 60 мин до сна; bedtime — время сна прошло, но отметки нет;
 * inBed — отмечено «Я в кровати»; morning — после подъёма, пока не отмечено «Встаю».
 */
export function useDayPhase(now: Date): DayPhase {
  const { bed, wake, nights } = useApp();
  const t = minutesOfDay(now);
  const rec = nights[nightKey(now)];
  const asleep = !!rec?.bedAt && !rec?.wakeAt;
  const awake = !!rec?.wakeAt;

  if (asleep) return inWindow(t, mod(wake - 60, 1440), mod(wake + 240, 1440)) ? 'morning' : 'inBed';
  if (awake) return inWindow(t, mod(bed - 60, 1440), bed) ? 'windDown' : 'day';
  if (inWindow(t, mod(bed - 60, 1440), bed)) return 'windDown';
  if (inWindow(t, bed, mod(wake - 60, 1440))) return 'bedtime';
  return 'day';
}

/** Утренняя палитра: от часа до подъёма до трёх часов после. */
export function isDawnTime(now: Date, wake: number) {
  return inWindow(minutesOfDay(now), mod(wake - 30, 1440), mod(wake + 180, 1440));
}
