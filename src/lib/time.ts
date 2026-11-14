// Время в расписании хранится как минуты от полуночи (0..1439).
export const DAY = 1440;

export const mod = (n: number, m: number) => ((n % m) + m) % m;

export function minutesOfDay(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

export function formatClock(min: number) {
  const m = mod(Math.round(min), DAY);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Длительность от bed до wake по часовой стрелке, в минутах. */
export function sleepDuration(bed: number, wake: number) {
  const d = mod(wake - bed, DAY);
  return d === 0 ? DAY : d;
}

/** Минут от now до ближайшего наступления target (0..1439). */
export function minutesUntil(now: Date, target: number) {
  return mod(target - minutesOfDay(now), DAY);
}

/** Находится ли момент t (минуты дня) в окне [from, to) с переходом через полночь. */
export function inWindow(t: number, from: number, to: number) {
  const len = mod(to - from, DAY);
  return mod(t - from, DAY) < len;
}

/**
 * Ключ «ночи» — дата вечера, к которому относится момент.
 * Сдвиг на 12 часов: 01:00 относится к предыдущему вечеру, 21:00 — к текущему.
 */
export function nightKey(d: Date) {
  const s = new Date(d.getTime() - 12 * 3600_000);
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
}

export function keyToDate(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDaysKey(key: string, days: number) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + days);
  return nightKey(new Date(d.getTime() + 12 * 3600_000));
}

/** Минуты вечера относительно полудня (12:00 → 0, 22:00 → 600, 01:00 → 780). Удобно для сравнений отхода ко сну. */
export function eveningMinutes(min: number) {
  return mod(min - 720, DAY);
}
