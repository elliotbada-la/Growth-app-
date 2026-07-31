import {
  DEFAULT_SLEEP_MAX_HOURS,
  DEFAULT_SLEEP_MIN_HOURS,
  DEFAULT_WATER_GOAL_ML,
  DEFAULT_WEIGHT_KG,
  PROTEIN_MULTIPLIER_DEFAULT,
  STORAGE_KEY,
} from './constants';
import type { AppData, UserSettings } from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'kg',
  currentWeightKg: DEFAULT_WEIGHT_KG,
  trainingMode: 'default',
  proteinMultiplier: PROTEIN_MULTIPLIER_DEFAULT,
  waterGoalMl: DEFAULT_WATER_GOAL_ML,
  sleepGoalMinHours: DEFAULT_SLEEP_MIN_HOURS,
  sleepGoalMaxHours: DEFAULT_SLEEP_MAX_HOURS,
  theme: 'system',
  snoozedAlerts: {},
};

export const EMPTY_DATA: AppData = {
  settings: DEFAULT_SETTINGS,
  customFoods: [],
  foodOverrides: {},
  foodLog: [],
  sleepLog: [],
  weightLog: [],
  waterLog: [],
};

/** Read saved data, merging over defaults so older saves keep working after an update. */
export function loadData(): AppData {
  if (typeof localStorage === 'undefined') return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...EMPTY_DATA,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      customFoods: parsed.customFoods ?? [],
      foodOverrides: parsed.foodOverrides ?? {},
      foodLog: parsed.foodLog ?? [],
      sleepLog: parsed.sleepLog ?? [],
      weightLog: parsed.weightLog ?? [],
      waterLog: parsed.waterLog ?? [],
    };
  } catch {
    return EMPTY_DATA;
  }
}

export function saveData(data: AppData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked — the app keeps working from memory for this session.
  }
}
