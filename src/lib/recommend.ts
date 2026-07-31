import { NUTRIENTS_BY_KEY, WATER_KEY } from '../data/nutrients';
import { MAIN_FOCUS_WEIGHT, MAX_RECOMMENDATIONS } from './constants';
import type { FoodItem, NutrientKey, NutrientProgress } from './types';

export interface FoodSuggestion {
  food: FoodItem;
  score: number;
  /** Nutrient keys this food contributes most toward, biggest contribution first. */
  fills: NutrientKey[];
}

/** Nutrients we never recommend food for: water comes from the water tracker, creatine is optional. */
const EXCLUDED_KEYS = new Set([WATER_KEY, 'creatine']);

interface ScoreOptions {
  /** Nutrients to weight above everything else (e.g. the ones on the Focus card). */
  emphasize?: NutrientKey[];
}

/**
 * Score how well one food closes today's remaining gaps.
 *
 * A food earns credit for the share of a gap it can actually fill — capped at the gap
 * itself, so a food with 10x the daily vitamin A doesn't outrank a balanced plate.
 * Main-focus nutrients are weighted up, and anything passed in `emphasize` more so.
 */
function scoreFood(
  food: FoodItem,
  gaps: Map<NutrientKey, { remaining: number; goal: number }>,
  options: ScoreOptions,
): FoodSuggestion {
  const emphasized = new Set(options.emphasize ?? []);
  const contributions: Array<{ key: NutrientKey; value: number }> = [];
  let score = 0;

  for (const [key, amountPerServing] of Object.entries(food.nutrients)) {
    if (typeof amountPerServing !== 'number' || amountPerServing <= 0) continue;
    if (EXCLUDED_KEYS.has(key)) continue;
    const gap = gaps.get(key);
    if (!gap || gap.remaining <= 0 || gap.goal <= 0) continue;

    const target = NUTRIENTS_BY_KEY[key];
    if (!target) continue;

    const filled = Math.min(amountPerServing, gap.remaining) / gap.goal;
    let weight = 1;
    if (target.category === 'main') weight *= MAIN_FOCUS_WEIGHT;
    if (emphasized.has(key)) weight *= 2.5;

    score += filled * weight;
    contributions.push({ key, value: filled * weight });
  }

  contributions.sort((a, b) => b.value - a.value);
  return { food, score, fills: contributions.slice(0, 3).map((c) => c.key) };
}

/** Rank foods by how well they close the day's remaining nutrient gaps. */
export function recommendFoods(
  foods: FoodItem[],
  progress: NutrientProgress[],
  options: ScoreOptions = {},
  limit = MAX_RECOMMENDATIONS,
): FoodSuggestion[] {
  const gaps = new Map(
    progress
      .filter((p) => p.remaining > 0)
      .map((p) => [p.target.key, { remaining: p.remaining, goal: p.goal }] as const),
  );

  if (gaps.size === 0) return [];

  return foods
    .map((food) => scoreFood(food, gaps, options))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Foods richest in a single nutrient, as a share of that nutrient's daily goal.
 * Used by the Focus card to name specific easy wins.
 */
export function foodsRichIn(foods: FoodItem[], key: NutrientKey, limit = 3): FoodItem[] {
  const target = NUTRIENTS_BY_KEY[key];
  if (!target || target.dailyTarget <= 0) return [];

  return foods
    .map((food) => ({ food, amount: food.nutrients[key] ?? 0 }))
    .filter((f) => f.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((f) => f.food);
}

/** "eggs, spinach and salmon" */
export function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
