/**
 * Tunable thresholds. Everything the Focus Alerts engine keys off lives here so
 * it can be adjusted in one place.
 */

/** Below this fraction of the daily goal, a nutrient is "focus on this" today. */
export const TODAY_FOCUS_THRESHOLD = 0.5;

/** Only raise today-alerts after this hour (24h local) — earlier in the day everything looks low. */
export const TODAY_FOCUS_AFTER_HOUR = 15;

/** Below this fraction averaged over the trend window, a nutrient is chronically low. */
export const WEEKLY_FOCUS_THRESHOLD = 0.7;

/** How many days back the trend alert looks. */
export const TREND_WINDOW_DAYS = 7;

/** How many nutrients the Focus card shows at once. */
export const MAX_FOCUS_ALERTS = 3;

/** Main-focus nutrients get this bump when ranking alerts, so they surface first. */
export const MAIN_FOCUS_WEIGHT = 1.35;

/** Days a dismissed alert stays hidden. */
export const SNOOZE_DAYS = 3;

/** Progress bar colour bands. */
export const STATUS_LOW_MAX = 0.34;
export const STATUS_PARTIAL_MAX = 0.8;

/** Water. */
export const DEFAULT_WATER_GOAL_ML = 3300;
export const ML_PER_OZ = 29.5735;
export const GLASS_ML = 250;

/** Sleep. */
export const DEFAULT_SLEEP_MIN_HOURS = 8;
export const DEFAULT_SLEEP_MAX_HOURS = 10;

/** Weight. The app works in pounds; this is only used to migrate older saved data. */
export const LB_PER_KG = 2.20462;
export const DEFAULT_WEIGHT_LB = 130;

/** Protein: grams per pound of body weight. */
export const PROTEIN_PER_LB_DEFAULT = 1;
export const PROTEIN_PER_LB_MIN = 0.5;
export const PROTEIN_PER_LB_MAX = 1.5;

/** How many foods the Best Foods engine recommends. */
export const MAX_RECOMMENDATIONS = 8;

export const STORAGE_KEY = 'growthtracker.v1';
