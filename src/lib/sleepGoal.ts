// Нормы сна по возрасту — research.md, раздел 2 (AASM).
export type SleepGoal = { min: number; max: number; target: number; group: 'teen' | 'young' | 'adult' };

export function sleepGoalForAge(age: number): SleepGoal {
  if (age < 18) return { min: 8 * 60, max: 10 * 60, target: 9 * 60, group: 'teen' };
  if (age <= 25) return { min: 7 * 60, max: 9 * 60, target: 8 * 60, group: 'young' };
  return { min: 7 * 60, max: 9 * 60, target: 8 * 60, group: 'adult' };
}

export type DurationVerdict = 'short' | 'ok' | 'long';

export function judgeDuration(duration: number, goal: SleepGoal): DurationVerdict {
  // Время в кровати чуть больше сна (засыпание ~15 мин), поэтому верх допускаем с запасом.
  if (duration < goal.min) return 'short';
  if (duration > goal.max + 60) return 'long';
  return 'ok';
}
