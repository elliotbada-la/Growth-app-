import { LB_PER_KG, ML_PER_OZ } from './constants';
import type { WeightUnit } from './types';

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

/** Convert a stored kg weight into the user's display unit. */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kgToLb(kg) : kg;
}

/** Convert a weight the user typed in their display unit back to kg for storage. */
export function toStoredWeight(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? lbToKg(value) : value;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${toDisplayWeight(kg, unit).toFixed(1)} ${unit}`;
}

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
