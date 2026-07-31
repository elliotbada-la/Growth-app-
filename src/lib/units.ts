import { ML_PER_OZ } from './constants';

export function formatWeight(lb: number): string {
  return `${lb.toFixed(1)} lb`;
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
