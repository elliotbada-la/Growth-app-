import { NUTRIENTS_BY_KEY } from '../data/nutrients';
import { addDays, today as todayISO } from './dates';
import { dailyTotals, goalFor } from './nutrition';
import type { AppData, FoodItem, UserSettings } from './types';

export interface Streaks {
  water: number;
  protein: number;
  sleep: number;
}

const MAX_LOOKBACK = 120;

/**
 * Consecutive days a goal has been met, counting back from today. Today only counts
 * if it's already met, so an in-progress day never breaks a streak.
 */
export function computeStreaks(data: AppData, foods: FoodItem[], settings: UserSettings): Streaks {
  const start = todayISO();
  const sleepByDate = new Map(data.sleepLog.map((s) => [s.date, s.hours]));

  const countStreak = (met: (date: string) => boolean): number => {
    // Today being unfinished shouldn't break a streak — start from yesterday instead.
    let offset = met(start) ? 0 : 1;
    let streak = 0;
    for (; offset < MAX_LOOKBACK; offset++) {
      if (!met(addDays(start, -offset))) break;
      streak++;
    }
    return streak;
  };

  const waterGoalL = settings.waterGoalMl / 1000;
  const proteinTarget = NUTRIENTS_BY_KEY.protein;

  return {
    water: countStreak((date) => (dailyTotals(data, foods, date).water ?? 0) >= waterGoalL),
    protein: countStreak(
      (date) =>
        (dailyTotals(data, foods, date).protein ?? 0) >= goalFor(proteinTarget, settings) &&
        goalFor(proteinTarget, settings) > 0,
    ),
    sleep: countStreak((date) => (sleepByDate.get(date) ?? 0) >= settings.sleepGoalMinHours),
  };
}
