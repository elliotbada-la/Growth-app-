import { NUTRIENT_TARGETS } from '../data/nutrients';
import {
  MAIN_FOCUS_WEIGHT,
  MAX_FOCUS_ALERTS,
  TODAY_FOCUS_AFTER_HOUR,
  TODAY_FOCUS_THRESHOLD,
  TREND_WINDOW_DAYS,
  WEEKLY_FOCUS_THRESHOLD,
} from './constants';
import { lastNDays, today as todayISO } from './dates';
import { dailyTotals, goalFor } from './nutrition';
import { foodsRichIn, joinNames } from './recommend';
import type { AppData, FoodItem, NutrientKey, NutrientTarget, UserSettings } from './types';

export interface FocusAlert {
  key: NutrientKey;
  target: NutrientTarget;
  kind: 'trend' | 'today';
  /** Average % of goal over the trend window, or today's % for a today-alert. */
  percentOfGoal: number;
  /** Days of data the trend figure is based on. */
  daysCounted: number;
  suggestions: FoodItem[];
  headline: string;
  message: string;
  /** Higher = more in need of attention. */
  rank: number;
}

/** A day counts toward the trend only if the user logged something that day. */
function daysWithActivity(data: AppData, dates: string[]): Set<string> {
  const active = new Set<string>();
  for (const entry of data.foodLog) if (dates.includes(entry.date)) active.add(entry.date);
  for (const entry of data.waterLog) if (dates.includes(entry.date)) active.add(entry.date);
  return active;
}

/**
 * Which nutrients the user should put extra attention on right now.
 *
 * Two signals: a chronic shortfall averaged over the trend window (the main one), and a
 * steep shortfall late in the current day. Main-focus nutrients rank above the rest, and
 * anything the user has snoozed is filtered out.
 */
export function computeFocusAlerts(
  data: AppData,
  foods: FoodItem[],
  settings: UserSettings,
  now = new Date(),
): FocusAlert[] {
  const currentDate = todayISO();
  const window = lastNDays(TREND_WINDOW_DAYS, currentDate);
  const active = daysWithActivity(data, window);
  const totalsByDate = new Map(window.map((d) => [d, dailyTotals(data, foods, d)]));
  const lateInDay = now.getHours() >= TODAY_FOCUS_AFTER_HOUR;
  const alerts: FocusAlert[] = [];

  for (const target of NUTRIENT_TARGETS) {
    if (target.category === 'optional') continue;

    const goal = goalFor(target, settings);
    if (goal <= 0) continue;

    const activeDates = window.filter((d) => active.has(d));
    const trendRatios = activeDates.map((d) => (totalsByDate.get(d)?.[target.key] ?? 0) / goal);
    const trendAvg =
      trendRatios.length > 0 ? trendRatios.reduce((a, b) => a + b, 0) / trendRatios.length : 1;
    const todayRatio = (totalsByDate.get(currentDate)?.[target.key] ?? 0) / goal;

    // Need at least a couple of logged days before calling something a trend.
    const trendFlagged = activeDates.length >= 2 && trendAvg < WEEKLY_FOCUS_THRESHOLD;
    const todayFlagged = lateInDay && active.has(currentDate) && todayRatio < TODAY_FOCUS_THRESHOLD;

    if (!trendFlagged && !todayFlagged) continue;

    const kind: FocusAlert['kind'] = trendFlagged ? 'trend' : 'today';
    const ratio = kind === 'trend' ? trendAvg : todayRatio;
    const suggestions = foodsRichIn(foods, target.key, 3);
    const names = joinNames(suggestions.map((f) => f.name.toLowerCase()));

    const shortfall = Math.max(0, 1 - ratio);
    const weight = target.category === 'main' ? MAIN_FOCUS_WEIGHT : 1;
    const kindBoost = kind === 'trend' ? 1.2 : 1;

    alerts.push({
      key: target.key,
      target,
      kind,
      percentOfGoal: Math.round(ratio * 100),
      daysCounted: activeDates.length,
      suggestions,
      headline:
        kind === 'trend'
          ? `${target.label}: averaging ${Math.round(trendAvg * 100)}% of goal this week`
          : `${target.label}: ${Math.round(todayRatio * 100)}% of today's goal so far`,
      message: names
        ? `Try to work more ${target.label.toLowerCase()}-rich foods in — ${names} are easy wins.`
        : `Worth working a bit more ${target.label.toLowerCase()} into the day.`,
      rank: shortfall * weight * kindBoost,
    });
  }

  const activeAlerts = alerts.filter((a) => !isSnoozed(settings, a.key, currentDate));
  activeAlerts.sort((a, b) => b.rank - a.rank);
  return activeAlerts.slice(0, MAX_FOCUS_ALERTS);
}

export function isSnoozed(settings: UserSettings, key: NutrientKey, date = todayISO()): boolean {
  const until = settings.snoozedAlerts[key];
  return Boolean(until && until > date);
}
