import type { NutrientProgress } from '../lib/types';

/** Red under 34%, amber under 80%, green at 80%+. */
export const STATUS_BAR: Record<NutrientProgress['status'], string> = {
  low: 'bg-rose-500',
  partial: 'bg-amber-400',
  good: 'bg-emerald-500',
};

export const STATUS_TEXT: Record<NutrientProgress['status'], string> = {
  low: 'text-rose-600 dark:text-rose-400',
  partial: 'text-amber-600 dark:text-amber-400',
  good: 'text-emerald-600 dark:text-emerald-400',
};

export const STATUS_STROKE: Record<NutrientProgress['status'], string> = {
  low: 'stroke-rose-500',
  partial: 'stroke-amber-400',
  good: 'stroke-emerald-500',
};

export const STATUS_SOFT_BG: Record<NutrientProgress['status'], string> = {
  low: 'bg-rose-50 dark:bg-rose-950/40',
  partial: 'bg-amber-50 dark:bg-amber-950/40',
  good: 'bg-emerald-50 dark:bg-emerald-950/40',
};
