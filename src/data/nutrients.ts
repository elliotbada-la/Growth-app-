import type { NutrientTarget } from '../lib/types';

/**
 * Daily targets for a growing teen (roughly the 14–18 DRI/AI range).
 * Protein is body-weight based and gets recalculated per user; the value here is
 * only a placeholder for when no weight is set.
 */
export const NUTRIENT_TARGETS: NutrientTarget[] = [
  // ---- Main focus ----
  {
    key: 'protein',
    label: 'Protein',
    unit: 'g',
    dailyTarget: 55,
    category: 'main',
    isBodyWeightBased: true,
    note: 'Based on your body weight',
  },
  { key: 'water', label: 'Water', unit: 'L', dailyTarget: 3.3, category: 'main', isBodyWeightBased: false, note: 'More if active or hot' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg', dailyTarget: 15, category: 'main', isBodyWeightBased: false, note: '600 IU' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', dailyTarget: 1300, category: 'main', isBodyWeightBased: false },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', dailyTarget: 410, category: 'main', isBodyWeightBased: false },
  { key: 'zinc', label: 'Zinc', unit: 'mg', dailyTarget: 11, category: 'main', isBodyWeightBased: false },
  { key: 'omega3', label: 'Omega-3', unit: 'g', dailyTarget: 1.6, category: 'main', isBodyWeightBased: false, note: 'ALA + EPA/DHA' },
  { key: 'iron', label: 'Iron', unit: 'mg', dailyTarget: 11, category: 'main', isBodyWeightBased: false },

  // ---- Vitamins ----
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', dailyTarget: 900, category: 'vitamin', isBodyWeightBased: false, note: 'RAE' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', dailyTarget: 75, category: 'vitamin', isBodyWeightBased: false },
  { key: 'vitaminE', label: 'Vitamin E', unit: 'mg', dailyTarget: 15, category: 'vitamin', isBodyWeightBased: false },
  { key: 'vitaminK', label: 'Vitamin K', unit: 'mcg', dailyTarget: 75, category: 'vitamin', isBodyWeightBased: false },
  { key: 'thiamine', label: 'Thiamine (B1)', unit: 'mg', dailyTarget: 1.2, category: 'vitamin', isBodyWeightBased: false },
  { key: 'riboflavin', label: 'Riboflavin (B2)', unit: 'mg', dailyTarget: 1.3, category: 'vitamin', isBodyWeightBased: false },
  { key: 'niacin', label: 'Niacin (B3)', unit: 'mg', dailyTarget: 16, category: 'vitamin', isBodyWeightBased: false, note: 'NE' },
  { key: 'pantothenicAcid', label: 'Pantothenic Acid (B5)', unit: 'mg', dailyTarget: 5, category: 'vitamin', isBodyWeightBased: false },
  { key: 'vitaminB6', label: 'Vitamin B6', unit: 'mg', dailyTarget: 1.3, category: 'vitamin', isBodyWeightBased: false },
  { key: 'biotin', label: 'Biotin (B7)', unit: 'mcg', dailyTarget: 25, category: 'vitamin', isBodyWeightBased: false },
  { key: 'folate', label: 'Folate (B9)', unit: 'mcg', dailyTarget: 400, category: 'vitamin', isBodyWeightBased: false, note: 'DFE' },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'mcg', dailyTarget: 2.4, category: 'vitamin', isBodyWeightBased: false },
  { key: 'choline', label: 'Choline', unit: 'mg', dailyTarget: 550, category: 'vitamin', isBodyWeightBased: false },

  // ---- Minerals ----
  { key: 'iodine', label: 'Iodine', unit: 'mcg', dailyTarget: 150, category: 'mineral', isBodyWeightBased: false },
  { key: 'selenium', label: 'Selenium', unit: 'mcg', dailyTarget: 55, category: 'mineral', isBodyWeightBased: false },
  { key: 'copper', label: 'Copper', unit: 'mcg', dailyTarget: 890, category: 'mineral', isBodyWeightBased: false },
  { key: 'manganese', label: 'Manganese', unit: 'mg', dailyTarget: 2.2, category: 'mineral', isBodyWeightBased: false },
  { key: 'potassium', label: 'Potassium', unit: 'mg', dailyTarget: 3000, category: 'mineral', isBodyWeightBased: false, note: 'AI, ages 14–18' },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg', dailyTarget: 1250, category: 'mineral', isBodyWeightBased: false },
  { key: 'chromium', label: 'Chromium', unit: 'mcg', dailyTarget: 35, category: 'mineral', isBodyWeightBased: false },
  { key: 'molybdenum', label: 'Molybdenum', unit: 'mcg', dailyTarget: 43, category: 'mineral', isBodyWeightBased: false },

  // ---- Optional ----
  {
    key: 'creatine',
    label: 'Creatine Monohydrate',
    unit: 'g',
    dailyTarget: 3,
    category: 'optional',
    isBodyWeightBased: false,
    note: 'Optional — not needed for growth. Ask a doctor first.',
  },
];

export const NUTRIENTS_BY_KEY: Record<string, NutrientTarget> = Object.fromEntries(
  NUTRIENT_TARGETS.map((n) => [n.key, n]),
);

export const CATEGORY_LABELS: Record<NutrientTarget['category'], string> = {
  main: 'Main focus',
  vitamin: 'Vitamins',
  mineral: 'Minerals',
  optional: 'Optional',
};

/** Nutrients that come from the water tracker rather than the food log. */
export const WATER_KEY = 'water';
