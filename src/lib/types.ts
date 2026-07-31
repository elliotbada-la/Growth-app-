export type NutrientKey = string;

export type NutrientCategory = 'main' | 'vitamin' | 'mineral' | 'optional';

export interface NutrientTarget {
  key: NutrientKey;
  label: string;
  /** Display unit, e.g. "mg", "mcg", "g", "L". */
  unit: string;
  /** Baseline daily target. For protein this is a fallback; the real value is body-weight based. */
  dailyTarget: number;
  category: NutrientCategory;
  isBodyWeightBased: boolean;
  /** Extra context shown under the nutrient name. */
  note?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  servingLabel: string;
  /** Amount of each nutrient in ONE serving, in that nutrient's display unit. */
  nutrients: Partial<Record<NutrientKey, number>>;
  /** True for user-created or user-edited foods (kept out of the bundled seed set). */
  custom?: boolean;
}

export interface FoodLogEntry {
  id: string;
  /** ISO date, YYYY-MM-DD (local). */
  date: string;
  foodItemId: string;
  servings: number;
  loggedAt: number;
}

export interface SleepEntry {
  id: string;
  /** The morning you woke up. */
  date: string;
  hours: number;
  bedtime?: string;
  wakeTime?: string;
  quality?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightLb: number;
}

export interface WaterEntry {
  id: string;
  date: string;
  amountMl: number;
  loggedAt: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  currentWeightLb: number;
  /** Grams of protein per pound of body weight. 1 g/lb by default. */
  proteinPerLb: number;
  waterGoalMl: number;
  sleepGoalMinHours: number;
  sleepGoalMaxHours: number;
  theme: Theme;
  /** Nutrient keys the user has snoozed, mapped to the date the snooze expires. */
  snoozedAlerts: Record<NutrientKey, string>;
}

export interface AppData {
  settings: UserSettings;
  customFoods: FoodItem[];
  /** Edits applied to seed foods, keyed by food id. */
  foodOverrides: Record<string, Partial<Record<NutrientKey, number>>>;
  foodLog: FoodLogEntry[];
  sleepLog: SleepEntry[];
  weightLog: WeightEntry[];
  waterLog: WaterEntry[];
}

/** A nutrient plus the user's progress against it for a given day. */
export interface NutrientProgress {
  target: NutrientTarget;
  /** Resolved target for this user (protein is body-weight based). */
  goal: number;
  consumed: number;
  remaining: number;
  /** 0..n, where 1 means the goal was met. */
  ratio: number;
  percent: number;
  status: 'low' | 'partial' | 'good';
}
