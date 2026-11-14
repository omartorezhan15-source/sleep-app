import { useApp } from '@/store/useApp';
import en from './en';
import ru, { type Dict } from './ru';

export type Locale = 'ru' | 'en';
const dicts: Record<Locale, Dict> = { ru, en };

export function fill(s: string, params?: Record<string, string | number>) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function getDict(locale: Locale) {
  return dicts[locale];
}

/** Возвращает словарь текущего языка и функцию подстановки параметров. */
export function useT() {
  const locale = useApp((s) => s.locale);
  return { t: dicts[locale], f: fill, locale };
}

export function formatDuration(min: number, d: Dict) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (m === 0) return `${h} ${d.common.hours}`;
  if (h === 0) return `${m} ${d.common.minutes}`;
  return `${h} ${d.common.hours} ${String(m).padStart(2, '0')} ${d.common.minutes}`;
}

export function formatRange(minM: number, maxM: number, d: Dict) {
  return `${minM / 60}–${maxM / 60} ${d.common.hours}`;
}
