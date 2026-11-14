import type { Dict } from '@/i18n/ru';
import type { Goal } from '@/store/useApp';

type FactKey = keyof Dict['facts'];

// Порядок фактов для каждой цели. Только утверждения из research.md, раздел 8 «Можно».
const byGoal: Record<Goal, FactKey[]> = {
  energy: ['sixHours', 'regularity', 'screens', 'light'],
  growth: ['growth', 'regularity', 'immunity', 'teens'],
  study: ['memory', 'sixHours', 'mood', 'screens'],
  sport: ['sport', 'growth', 'sixHours', 'regularity'],
};
const general: FactKey[] = ['regularity', 'screens', 'teens', 'mood', 'light'];

/** Один факт на день: меняется раз в сутки, подстраивается под цели. */
export function factOfDay(goals: Goal[], date: Date, d: Dict, slot: 'evening' | 'morning' = 'evening') {
  if (slot === 'morning') return d.facts.light;
  const pool = Array.from(new Set([...goals.flatMap((g) => byGoal[g]), ...general]));
  const day = Math.floor(date.getTime() / 86_400_000);
  return d.facts[pool[day % pool.length]];
}
