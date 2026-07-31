import { NUTRIENT_TARGETS, WATER_KEY } from '../data/nutrients';
import { STATUS_LOW_MAX, STATUS_PARTIAL_MAX } from './constants';
import type {
  AppData,
  FoodItem,
  NutrientKey,
  NutrientProgress,
  NutrientTarget,
  UserSettings,
} from './types';

/** Protein goal in grams: body weight in pounds × grams per pound. */
export function proteinGoal(settings: UserSettings): number {
  const weight = settings.currentWeightLb > 0 ? settings.currentWeightLb : 0;
  return Math.round(weight * settings.proteinPerLb);
}

/** The resolved daily goal for a nutrient, accounting for body-weight and user-set goals. */
export function goalFor(target: NutrientTarget, settings: UserSettings): number {
  if (target.key === 'protein') return proteinGoal(settings) || target.dailyTarget;
  if (target.key === WATER_KEY) return settings.waterGoalMl / 1000;
  return target.dailyTarget;
}

export function statusFor(ratio: number): NutrientProgress['status'] {
  if (ratio < STATUS_LOW_MAX) return 'low';
  if (ratio < STATUS_PARTIAL_MAX) return 'partial';
  return 'good';
}

/** Every food the user can log: seed foods with any edits applied, plus custom foods. */
export function resolveFoods(seed: FoodItem[], data: AppData): FoodItem[] {
  const edited = seed.map((f) => {
    const override = data.foodOverrides[f.id];
    return override ? { ...f, nutrients: { ...f.nutrients, ...override } } : f;
  });
  return [...edited, ...data.customFoods];
}

/** Sum every nutrient logged on a given date, including water from the water tracker. */
export function dailyTotals(
  data: AppData,
  foods: FoodItem[],
  date: string,
): Record<NutrientKey, number> {
  const byId = new Map(foods.map((f) => [f.id, f]));
  const totals: Record<NutrientKey, number> = {};

  for (const entry of data.foodLog) {
    if (entry.date !== date) continue;
    const food = byId.get(entry.foodItemId);
    if (!food) continue;
    for (const [key, amount] of Object.entries(food.nutrients)) {
      if (typeof amount !== 'number') continue;
      totals[key] = (totals[key] ?? 0) + amount * entry.servings;
    }
  }

  const waterMl = data.waterLog
    .filter((w) => w.date === date)
    .reduce((sum, w) => sum + w.amountMl, 0);
  totals[WATER_KEY] = (totals[WATER_KEY] ?? 0) + waterMl / 1000;

  return totals;
}

export function progressFor(
  target: NutrientTarget,
  consumed: number,
  settings: UserSettings,
): NutrientProgress {
  const goal = goalFor(target, settings);
  const amount = consumed || 0;
  const ratio = goal > 0 ? amount / goal : 0;
  return {
    target,
    goal,
    consumed: amount,
    remaining: Math.max(0, goal - amount),
    ratio,
    percent: Math.round(ratio * 100),
    status: statusFor(ratio),
  };
}

/** Progress for every nutrient in the table, in table order. */
export function allProgress(
  totals: Record<NutrientKey, number>,
  settings: UserSettings,
): NutrientProgress[] {
  return NUTRIENT_TARGETS.map((t) => progressFor(t, totals[t.key] ?? 0, settings));
}

/**
 * Overall "goals met" percentage. Each nutrient counts at most once (capped at 100%)
 * so a huge vitamin A day can't paper over missing calcium. Optional nutrients are
 * excluded — creatine isn't part of hitting your goals.
 */
export function overallPercent(progress: NutrientProgress[]): number {
  const counted = progress.filter((p) => p.target.category !== 'optional');
  if (counted.length === 0) return 0;
  const sum = counted.reduce((acc, p) => acc + Math.min(1, p.ratio), 0);
  return Math.round((sum / counted.length) * 100);
}

/** Format an amount with a sensible number of decimals for its size. */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 100) return String(Math.round(value));
  if (abs >= 1) return value.toFixed(1).replace(/\.0$/, '');
  if (abs === 0) return '0';
  return value.toFixed(2).replace(/0$/, '');
}
