import {
  DEFAULT_SLEEP_MAX_HOURS,
  DEFAULT_SLEEP_MIN_HOURS,
  DEFAULT_WATER_GOAL_ML,
  DEFAULT_WEIGHT_LB,
  LB_PER_KG,
  PROTEIN_PER_LB_DEFAULT,
  STORAGE_KEY,
} from './constants';
import type { AppData, UserSettings, WeightEntry } from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  currentWeightLb: DEFAULT_WEIGHT_LB,
  proteinPerLb: PROTEIN_PER_LB_DEFAULT,
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

/** Shape of saves written before the app moved to pounds. */
interface LegacySettings {
  currentWeightKg?: number;
  proteinMultiplier?: number;
  weightUnit?: string;
  trainingMode?: string;
}
type LegacyWeightEntry = WeightEntry & { weightKg?: number };

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Bring a save written by an older build up to date.
 *
 * The app used to store weight in kilograms with a kg/lb display toggle, and a protein
 * multiplier expressed per kilogram. Weights are converted so no history is lost. The
 * protein rate is deliberately NOT converted — it is reset to the current default,
 * because changing that rate is the point of the move to pounds.
 */
function migrateToPounds(
  settings: Partial<UserSettings> & LegacySettings,
  weightLog: LegacyWeightEntry[],
) {
  if (settings.currentWeightLb === undefined && typeof settings.currentWeightKg === 'number') {
    settings.currentWeightLb = round1(settings.currentWeightKg * LB_PER_KG);
  }
  delete settings.currentWeightKg;
  delete settings.proteinMultiplier;
  delete settings.weightUnit;
  delete settings.trainingMode;

  for (const entry of weightLog) {
    if (entry.weightLb === undefined && typeof entry.weightKg === 'number') {
      entry.weightLb = round1(entry.weightKg * LB_PER_KG);
    }
    delete entry.weightKg;
  }

  // The newest weigh-in is the source of truth for the protein goal, so keep the
  // settings value pinned to it rather than trusting a stale copy.
  const latest = weightLog[weightLog.length - 1];
  if (latest && typeof latest.weightLb === 'number') settings.currentWeightLb = latest.weightLb;
}

/** Read saved data, merging over defaults so older saves keep working after an update. */
export function loadData(): AppData {
  if (typeof localStorage === 'undefined') return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as Partial<AppData>;

    // Migrate the raw save first: merging defaults in beforehand would mask the
    // missing pound fields that mark an older save.
    const rawSettings = (parsed.settings ?? {}) as Partial<UserSettings> & LegacySettings;
    const weightLog = parsed.weightLog ?? [];
    migrateToPounds(rawSettings, weightLog);
    const settings = { ...DEFAULT_SETTINGS, ...rawSettings };

    return {
      ...EMPTY_DATA,
      ...parsed,
      settings,
      weightLog: weightLog.filter((w) => typeof w.weightLb === 'number'),
      customFoods: parsed.customFoods ?? [],
      foodOverrides: parsed.foodOverrides ?? {},
      foodLog: parsed.foodLog ?? [],
      sleepLog: parsed.sleepLog ?? [],
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
